import {
  AttachmentType,
  PermissionMode,
  Prisma,
  ProjectGroupMessageType,
  ProjectRole,
  TaskPriority,
} from '@prisma/client';
import { gunzipSync, gzipSync } from 'zlib';
import { prisma } from '../config';
import { ApiError } from '../utils/ApiError';
import { toSlug } from '../utils/slug';
import { permissionService } from './permission.service';
import { resolveLocalAbsolutePath } from './storage/local.storage';
import { storeBackupBuffer } from './storage/storage.service';
import {
  PLANORA_BACKUP_APP,
  PLANORA_BACKUP_VERSION,
  type BackupFileEntry,
  type ProjectBackupArchive,
  type ProjectBackupImportResult,
} from './project-backup.types';
import fs from 'fs/promises';

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

async function resolveProjectId(idOrSlug: string): Promise<string> {
  if (OBJECT_ID_PATTERN.test(idOrSlug)) {
    return idOrSlug;
  }

  const project = await prisma.project.findUnique({
    where: { slug: idOrSlug },
  });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return project.id;
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function requiredIso(value: Date | string): string {
  return iso(value) ?? new Date().toISOString();
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function requiredDate(value: string): Date {
  return parseDate(value) ?? new Date();
}

function fileKey(kind: string, id: string): string {
  return `${kind}/${id}`;
}

async function readStoredBytes(input: {
  url: string | null | undefined;
  storageKey: string | null | undefined;
  storageProvider: string | null | undefined;
}): Promise<Buffer | null> {
  const provider = input.storageProvider ?? 'local';

  if (provider === 'local' && input.storageKey) {
    try {
      return await fs.readFile(resolveLocalAbsolutePath(input.storageKey));
    } catch {
      // fall through to URL fetch
    }
  }

  const url = input.url;
  if (!url) return null;

  try {
    if (url.startsWith('/uploads/')) {
      return await fs.readFile(
        resolveLocalAbsolutePath(url.replace(/^\/uploads\//, '')),
      );
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      const response = await fetch(url);
      if (!response.ok) return null;
      return Buffer.from(await response.arrayBuffer());
    }
  } catch {
    return null;
  }

  return null;
}

function encodeArchive(archive: ProjectBackupArchive): Buffer {
  return gzipSync(Buffer.from(JSON.stringify(archive), 'utf8'));
}

function decodeArchive(buffer: Buffer): ProjectBackupArchive {
  let jsonText: string;

  try {
    if (buffer[0] === 0x1f && buffer[1] === 0x8b) {
      jsonText = gunzipSync(buffer).toString('utf8');
    } else {
      jsonText = buffer.toString('utf8');
    }
  } catch {
    throw new ApiError(400, 'Invalid or corrupted backup file');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new ApiError(400, 'Invalid or corrupted backup file');
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    (parsed as ProjectBackupArchive).app !== PLANORA_BACKUP_APP ||
    (parsed as ProjectBackupArchive).version !== PLANORA_BACKUP_VERSION
  ) {
    throw new ApiError(400, 'Unsupported backup file format');
  }

  return parsed as ProjectBackupArchive;
}

export class ProjectBackupService {
  async exportProject(
    userId: string,
    projectIdOrSlug: string,
  ): Promise<{ filename: string; buffer: Buffer }> {
    const projectId = await resolveProjectId(projectIdOrSlug);
    const project = await permissionService.ensurePermission(
      userId,
      projectId,
      'project.delete',
    );

    const [
      members,
      roleDefinitions,
      boards,
      labels,
      holidays,
      leaves,
      dependencies,
      groupMessages,
    ] = await Promise.all([
      prisma.projectMember.findMany({ where: { projectId: project.id } }),
      prisma.projectRoleDefinition.findMany({
        where: { projectId: project.id },
        orderBy: { position: 'asc' },
      }),
      prisma.board.findMany({
        where: { projectId: project.id },
        orderBy: { position: 'asc' },
      }),
      prisma.label.findMany({ where: { projectId: project.id } }),
      prisma.projectHoliday.findMany({ where: { projectId: project.id } }),
      prisma.memberLeave.findMany({ where: { projectId: project.id } }),
      prisma.taskDependency.findMany({ where: { projectId: project.id } }),
      prisma.projectGroupMessage.findMany({
        where: { projectId: project.id },
        include: { attachments: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const boardIds = boards.map((b) => b.id);
    const columns = boardIds.length
      ? await prisma.column.findMany({
          where: { boardId: { in: boardIds } },
          orderBy: { position: 'asc' },
        })
      : [];

    const tasks = boardIds.length
      ? await prisma.task.findMany({
          where: { boardId: { in: boardIds } },
          orderBy: { position: 'asc' },
        })
      : [];

    const taskIds = tasks.map((t) => t.id);

    const [taskLabels, checklistItems, comments, attachments] =
      await Promise.all([
        taskIds.length
          ? prisma.taskLabel.findMany({ where: { taskId: { in: taskIds } } })
          : Promise.resolve([]),
        taskIds.length
          ? prisma.taskChecklistItem.findMany({
              where: { taskId: { in: taskIds } },
              orderBy: { position: 'asc' },
            })
          : Promise.resolve([]),
        taskIds.length
          ? prisma.comment.findMany({ where: { taskId: { in: taskIds } } })
          : Promise.resolve([]),
        taskIds.length
          ? prisma.attachment.findMany({ where: { taskId: { in: taskIds } } })
          : Promise.resolve([]),
      ]);

    const userIdSet = new Set<string>();
    userIdSet.add(project.ownerId);
    for (const member of members) userIdSet.add(member.userId);
    for (const task of tasks) {
      userIdSet.add(task.createdById);
      for (const assigneeId of task.assigneeIds) userIdSet.add(assigneeId);
    }
    for (const comment of comments) userIdSet.add(comment.authorId);
    for (const leave of leaves) {
      userIdSet.add(leave.userId);
      userIdSet.add(leave.createdById);
    }
    for (const dep of dependencies) userIdSet.add(dep.createdById);
    for (const message of groupMessages) {
      if (message.authorId) userIdSet.add(message.authorId);
    }

    const users = await prisma.user.findMany({
      where: { id: { in: [...userIdSet] } },
    });

    const files: BackupFileEntry[] = [];
    const pushFile = async (
      key: string,
      filename: string,
      mimeType: string,
      bytes: Buffer | null,
    ) => {
      if (!bytes || bytes.length === 0) return;
      files.push({
        key,
        filename,
        mimeType,
        dataBase64: bytes.toString('base64'),
      });
    };

    const backupUsers = [];
    for (const user of users) {
      let avatarFileKey: string | null = null;
      if (user.avatar) {
        avatarFileKey = fileKey('avatars', user.id);
        const bytes = await readStoredBytes({
          url: user.avatar,
          storageKey: user.avatar.startsWith('/uploads/')
            ? user.avatar.replace(/^\/uploads\//, '')
            : null,
          storageProvider: user.avatar.includes('cloudinary')
            ? 'cloudinary'
            : 'local',
        });
        await pushFile(avatarFileKey, `avatar-${user.id}`, 'image/png', bytes);
        if (!bytes) avatarFileKey = null;
      }

      backupUsers.push({
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.password,
        avatar: user.avatar,
        avatarFileKey,
      });
    }

    const backupBoards = [];
    for (const board of boards) {
      let backgroundFileKey: string | null = null;
      if (board.backgroundUrl || board.backgroundStorageKey) {
        backgroundFileKey = fileKey('board-backgrounds', board.id);
        const bytes = await readStoredBytes({
          url: board.backgroundUrl,
          storageKey: board.backgroundStorageKey,
          storageProvider: board.backgroundStorageProvider,
        });
        await pushFile(
          backgroundFileKey,
          `board-bg-${board.id}`,
          'image/jpeg',
          bytes,
        );
        if (!bytes) backgroundFileKey = null;
      }

      backupBoards.push({
        id: board.id,
        name: board.name,
        slug: board.slug,
        position: board.position,
        backgroundUrl: board.backgroundUrl,
        backgroundStorageKey: board.backgroundStorageKey,
        backgroundStorageProvider: board.backgroundStorageProvider,
        backgroundFileKey,
        createdAt: requiredIso(board.createdAt),
        updatedAt: requiredIso(board.updatedAt),
      });
    }

    const backupAttachments = [];
    for (const attachment of attachments) {
      const key = fileKey('attachments', attachment.id);
      const bytes = await readStoredBytes({
        url: attachment.url,
        storageKey: attachment.storageKey,
        storageProvider: attachment.storageProvider,
      });
      await pushFile(key, attachment.filename, attachment.mimeType, bytes);
      if (!bytes) continue;

      backupAttachments.push({
        id: attachment.id,
        taskId: attachment.taskId,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        type: attachment.type,
        fileKey: key,
        createdAt: requiredIso(attachment.createdAt),
      });
    }

    const backupGroupMessages = [];
    for (const message of groupMessages) {
      const messageAttachments = [];
      for (const attachment of message.attachments) {
        const key = fileKey('group-attachments', attachment.id);
        const bytes = await readStoredBytes({
          url: attachment.url,
          storageKey: attachment.storageKey,
          storageProvider: attachment.storageProvider,
        });
        await pushFile(key, attachment.filename, attachment.mimeType, bytes);
        if (!bytes) continue;

        messageAttachments.push({
          id: attachment.id,
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          size: attachment.size,
          type: attachment.type,
          fileKey: key,
          createdAt: requiredIso(attachment.createdAt),
        });
      }

      backupGroupMessages.push({
        id: message.id,
        type: message.type,
        content: message.content,
        authorId: message.authorId,
        activityType: message.activityType,
        activityData: message.activityData,
        createdAt: requiredIso(message.createdAt),
        updatedAt: requiredIso(message.updatedAt),
        editedAt: iso(message.editedAt),
        attachments: messageAttachments,
      });
    }

    const archive: ProjectBackupArchive = {
      version: PLANORA_BACKUP_VERSION,
      app: PLANORA_BACKUP_APP,
      exportedAt: new Date().toISOString(),
      project: {
        name: project.name,
        slug: project.slug,
        description: project.description,
        permissionMode: project.permissionMode,
        nonWorkingWeekdays: project.nonWorkingWeekdays,
        createdAt: requiredIso(project.createdAt),
        updatedAt: requiredIso(project.updatedAt),
        ownerId: project.ownerId,
      },
      users: backupUsers,
      members: members.map((member) => ({
        userId: member.userId,
        role: member.role,
        roleDefinitionId: member.roleDefinitionId,
        joinedAt: requiredIso(member.joinedAt),
      })),
      roleDefinitions: roleDefinitions.map((role) => ({
        id: role.id,
        name: role.name,
        permissions: role.permissions,
        position: role.position,
      })),
      boards: backupBoards,
      columns: columns.map((column) => ({
        id: column.id,
        boardId: column.boardId,
        name: column.name,
        position: column.position,
        color: column.color,
        createdAt: requiredIso(column.createdAt),
        updatedAt: requiredIso(column.updatedAt),
      })),
      labels: labels.map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
      })),
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        slug: task.slug,
        description: task.description,
        columnId: task.columnId,
        boardId: task.boardId,
        position: task.position,
        priority: task.priority,
        startDate: iso(task.startDate),
        dueDate: iso(task.dueDate),
        completeDate: iso(task.completeDate),
        progress: task.progress,
        isCompleted: task.isCompleted,
        autoCompleteSuppressed: task.autoCompleteSuppressed,
        parentTaskId: task.parentTaskId,
        assigneeIds: task.assigneeIds,
        createdById: task.createdById,
        createdAt: requiredIso(task.createdAt),
        updatedAt: requiredIso(task.updatedAt),
      })),
      taskLabels: taskLabels.map((item) => ({
        taskId: item.taskId,
        labelId: item.labelId,
      })),
      checklistItems: checklistItems.map((item) => ({
        id: item.id,
        taskId: item.taskId,
        title: item.title,
        isDone: item.isDone,
        completedAt: iso(item.completedAt),
        weight: item.weight,
        position: item.position,
        createdAt: requiredIso(item.createdAt),
        updatedAt: requiredIso(item.updatedAt),
      })),
      comments: comments.map((comment) => ({
        id: comment.id,
        taskId: comment.taskId,
        authorId: comment.authorId,
        content: comment.content,
        createdAt: requiredIso(comment.createdAt),
        updatedAt: requiredIso(comment.updatedAt),
      })),
      attachments: backupAttachments,
      dependencies: dependencies.map((dep) => ({
        id: dep.id,
        fromTaskId: dep.fromTaskId,
        toTaskId: dep.toTaskId,
        createdById: dep.createdById,
        createdAt: requiredIso(dep.createdAt),
      })),
      holidays: holidays.map((holiday) => ({
        id: holiday.id,
        date: requiredIso(holiday.date),
        title: holiday.title,
        createdAt: requiredIso(holiday.createdAt),
      })),
      leaves: leaves.map((leave) => ({
        id: leave.id,
        userId: leave.userId,
        startDate: requiredIso(leave.startDate),
        endDate: requiredIso(leave.endDate),
        note: leave.note,
        createdById: leave.createdById,
        createdAt: requiredIso(leave.createdAt),
      })),
      groupMessages: backupGroupMessages,
      files,
    };

    const safeSlug = toSlug(project.slug) || 'project';
    return {
      filename: `${safeSlug}-backup.planora`,
      buffer: encodeArchive(archive),
    };
  }

  async importProject(
    importerUserId: string,
    fileBuffer: Buffer,
  ): Promise<ProjectBackupImportResult> {
    const archive = decodeArchive(fileBuffer);

    if (!archive.project?.name || !Array.isArray(archive.users)) {
      throw new ApiError(400, 'Backup file is missing required project data');
    }

    const fileMap = new Map(
      (archive.files ?? []).map((file) => [file.key, file]),
    );

    let usersCreated = 0;
    let usersReused = 0;
    let filesRestored = 0;
    let filesSkipped = 0;

    const userIdMap = new Map<string, string>();
    const roleIdMap = new Map<string, string>();
    const boardIdMap = new Map<string, string>();
    const columnIdMap = new Map<string, string>();
    const labelIdMap = new Map<string, string>();
    const taskIdMap = new Map<string, string>();

    const mapUserId = (oldId: string | null | undefined): string | null => {
      if (!oldId) return null;
      return userIdMap.get(oldId) ?? null;
    };

    const requireUserId = (oldId: string, fallback: string): string => {
      return userIdMap.get(oldId) ?? fallback;
    };

    const restoreFile = async (
      key: string | null | undefined,
    ): Promise<{
      url: string;
      storageKey: string;
      storageProvider: 'local' | 'cloudinary';
      mimeType: string;
      filename: string;
      size: number;
      type: AttachmentType;
    } | null> => {
      if (!key) return null;
      const entry = fileMap.get(key);
      if (!entry?.dataBase64) {
        filesSkipped += 1;
        return null;
      }

      try {
        const buffer = Buffer.from(entry.dataBase64, 'base64');
        const stored = await storeBackupBuffer({
          buffer,
          filename: entry.filename,
          mimeType: entry.mimeType || 'application/octet-stream',
        });
        filesRestored += 1;
        return {
          url: stored.url,
          storageKey: stored.storageKey,
          storageProvider: stored.storageProvider,
          mimeType: stored.mimeType,
          filename: stored.filename,
          size: stored.size,
          type: stored.type,
        };
      } catch {
        filesSkipped += 1;
        return null;
      }
    };

    for (const backupUser of archive.users) {
      const email = backupUser.email.trim().toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email } });

      if (existing) {
        userIdMap.set(backupUser.id, existing.id);
        usersReused += 1;

        if (!existing.avatar && backupUser.avatarFileKey) {
          const restored = await restoreFile(backupUser.avatarFileKey);
          if (restored) {
            await prisma.user.update({
              where: { id: existing.id },
              data: { avatar: restored.url },
            });
          }
        }
        continue;
      }

      const restoredAvatar = await restoreFile(backupUser.avatarFileKey);
      const created = await prisma.user.create({
        data: {
          email,
          name: backupUser.name,
          password: backupUser.passwordHash,
          avatar: restoredAvatar?.url ?? null,
        },
      });
      userIdMap.set(backupUser.id, created.id);
      usersCreated += 1;
    }

    const importer = await prisma.user.findUnique({
      where: { id: importerUserId },
    });
    if (!importer) {
      throw new ApiError(401, 'Unauthorized');
    }

    // Importer becomes project owner; other users keep memberships from the archive.
    let slug =
      toSlug(archive.project.slug || archive.project.name) || 'project';
    const slugConflict = await prisma.project.findUnique({ where: { slug } });
    if (slugConflict) {
      slug = `${slug}-${Date.now()}`;
    }

    const project = await prisma.project.create({
      data: {
        name: archive.project.name,
        slug,
        description: archive.project.description,
        ownerId: importerUserId,
        permissionMode:
          archive.project.permissionMode === 'CUSTOM'
            ? PermissionMode.CUSTOM
            : PermissionMode.DEFAULT,
        nonWorkingWeekdays: archive.project.nonWorkingWeekdays?.length
          ? archive.project.nonWorkingWeekdays
          : [5],
      },
    });

    for (const role of archive.roleDefinitions ?? []) {
      const created = await prisma.projectRoleDefinition.create({
        data: {
          projectId: project.id,
          name: role.name,
          permissions: role.permissions,
          position: role.position,
        },
      });
      roleIdMap.set(role.id, created.id);
    }

    const memberUserIds = new Set<string>();

    // Importer is always OWNER member
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: importerUserId,
        role: ProjectRole.OWNER,
        roleDefinitionId: null,
      },
    });
    memberUserIds.add(importerUserId);

    for (const member of archive.members ?? []) {
      const newUserId = mapUserId(member.userId);
      if (!newUserId || memberUserIds.has(newUserId)) continue;

      let role = member.role as ProjectRole;
      if (role === ProjectRole.OWNER && newUserId !== importerUserId) {
        role = ProjectRole.ADMIN;
      }

      const roleDefinitionId =
        member.roleDefinitionId && roleIdMap.has(member.roleDefinitionId)
          ? roleIdMap.get(member.roleDefinitionId)!
          : null;

      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: newUserId,
          role,
          roleDefinitionId:
            archive.project.permissionMode === 'CUSTOM'
              ? roleDefinitionId
              : null,
          joinedAt: requiredDate(member.joinedAt),
        },
      });
      memberUserIds.add(newUserId);
    }

    for (const label of archive.labels ?? []) {
      const created = await prisma.label.create({
        data: {
          projectId: project.id,
          name: label.name,
          color: label.color,
        },
      });
      labelIdMap.set(label.id, created.id);
    }

    for (const board of archive.boards ?? []) {
      const background = await restoreFile(board.backgroundFileKey);
      const created = await prisma.board.create({
        data: {
          projectId: project.id,
          name: board.name,
          slug: board.slug,
          position: board.position,
          backgroundUrl: background?.url ?? null,
          backgroundStorageKey: background?.storageKey ?? null,
          backgroundStorageProvider: background?.storageProvider ?? null,
          createdAt: requiredDate(board.createdAt),
          updatedAt: requiredDate(board.updatedAt),
        },
      });
      boardIdMap.set(board.id, created.id);
    }

    for (const column of archive.columns ?? []) {
      const newBoardId = boardIdMap.get(column.boardId);
      if (!newBoardId) continue;

      const created = await prisma.column.create({
        data: {
          boardId: newBoardId,
          name: column.name,
          position: column.position,
          color: column.color,
          createdAt: requiredDate(column.createdAt),
          updatedAt: requiredDate(column.updatedAt),
        },
      });
      columnIdMap.set(column.id, created.id);
    }

    // Create tasks without parent links first, then patch parents
    for (const task of archive.tasks ?? []) {
      const newBoardId = boardIdMap.get(task.boardId);
      const newColumnId = columnIdMap.get(task.columnId);
      if (!newBoardId || !newColumnId) continue;

      const created = await prisma.task.create({
        data: {
          title: task.title,
          slug: task.slug,
          description: task.description,
          boardId: newBoardId,
          columnId: newColumnId,
          position: task.position,
          priority: task.priority as TaskPriority,
          startDate: parseDate(task.startDate),
          dueDate: parseDate(task.dueDate),
          completeDate: parseDate(task.completeDate),
          progress: task.progress,
          isCompleted: task.isCompleted,
          autoCompleteSuppressed: task.autoCompleteSuppressed,
          parentTaskId: null,
          assigneeIds: task.assigneeIds
            .map((id) => mapUserId(id))
            .filter((id): id is string => Boolean(id)),
          createdById: requireUserId(task.createdById, importerUserId),
          createdAt: requiredDate(task.createdAt),
          updatedAt: requiredDate(task.updatedAt),
        },
      });
      taskIdMap.set(task.id, created.id);
    }

    for (const task of archive.tasks ?? []) {
      if (!task.parentTaskId) continue;
      const newId = taskIdMap.get(task.id);
      const newParentId = taskIdMap.get(task.parentTaskId);
      if (!newId || !newParentId) continue;
      await prisma.task.update({
        where: { id: newId },
        data: { parentTaskId: newParentId },
      });
    }

    for (const item of archive.taskLabels ?? []) {
      const taskId = taskIdMap.get(item.taskId);
      const labelId = labelIdMap.get(item.labelId);
      if (!taskId || !labelId) continue;
      await prisma.taskLabel.create({
        data: { taskId, labelId },
      });
    }

    for (const item of archive.checklistItems ?? []) {
      const taskId = taskIdMap.get(item.taskId);
      if (!taskId) continue;
      await prisma.taskChecklistItem.create({
        data: {
          taskId,
          title: item.title,
          isDone: item.isDone,
          completedAt: parseDate(item.completedAt),
          weight: item.weight,
          position: item.position,
          createdAt: requiredDate(item.createdAt),
          updatedAt: requiredDate(item.updatedAt),
        },
      });
    }

    for (const comment of archive.comments ?? []) {
      const taskId = taskIdMap.get(comment.taskId);
      const authorId = mapUserId(comment.authorId);
      if (!taskId || !authorId) continue;
      await prisma.comment.create({
        data: {
          taskId,
          authorId,
          content: comment.content,
          createdAt: requiredDate(comment.createdAt),
          updatedAt: requiredDate(comment.updatedAt),
        },
      });
    }

    for (const attachment of archive.attachments ?? []) {
      const taskId = taskIdMap.get(attachment.taskId);
      if (!taskId) continue;
      const restored = await restoreFile(attachment.fileKey);
      if (!restored) continue;

      await prisma.attachment.create({
        data: {
          taskId,
          filename: attachment.filename,
          url: restored.url,
          mimeType: restored.mimeType,
          size: restored.size,
          type: (attachment.type as AttachmentType) || restored.type,
          storageKey: restored.storageKey,
          storageProvider: restored.storageProvider,
          createdAt: requiredDate(attachment.createdAt),
        },
      });
    }

    for (const dep of archive.dependencies ?? []) {
      const fromTaskId = taskIdMap.get(dep.fromTaskId);
      const toTaskId = taskIdMap.get(dep.toTaskId);
      if (!fromTaskId || !toTaskId) continue;
      await prisma.taskDependency.create({
        data: {
          projectId: project.id,
          fromTaskId,
          toTaskId,
          createdById: requireUserId(dep.createdById, importerUserId),
          createdAt: requiredDate(dep.createdAt),
        },
      });
    }

    for (const holiday of archive.holidays ?? []) {
      try {
        await prisma.projectHoliday.create({
          data: {
            projectId: project.id,
            date: requiredDate(holiday.date),
            title: holiday.title,
            createdAt: requiredDate(holiday.createdAt),
          },
        });
      } catch {
        // Skip duplicate calendar days
      }
    }

    for (const leave of archive.leaves ?? []) {
      const userId = mapUserId(leave.userId);
      const createdById = mapUserId(leave.createdById) ?? importerUserId;
      if (!userId) continue;
      await prisma.memberLeave.create({
        data: {
          projectId: project.id,
          userId,
          startDate: requiredDate(leave.startDate),
          endDate: requiredDate(leave.endDate),
          note: leave.note,
          createdById,
          createdAt: requiredDate(leave.createdAt),
        },
      });
    }

    for (const message of archive.groupMessages ?? []) {
      const created = await prisma.projectGroupMessage.create({
        data: {
          projectId: project.id,
          type: message.type as ProjectGroupMessageType,
          content: message.content,
          authorId: mapUserId(message.authorId),
          activityType: message.activityType,
          activityData:
            message.activityData === null || message.activityData === undefined
              ? undefined
              : (message.activityData as Prisma.InputJsonValue),
          createdAt: requiredDate(message.createdAt),
          updatedAt: requiredDate(message.updatedAt),
          editedAt: parseDate(message.editedAt),
        },
      });

      for (const attachment of message.attachments ?? []) {
        const restored = await restoreFile(attachment.fileKey);
        if (!restored) continue;
        await prisma.projectGroupAttachment.create({
          data: {
            messageId: created.id,
            filename: attachment.filename,
            url: restored.url,
            mimeType: restored.mimeType,
            size: restored.size,
            type: (attachment.type as AttachmentType) || restored.type,
            storageKey: restored.storageKey,
            storageProvider: restored.storageProvider,
            createdAt: requiredDate(attachment.createdAt),
          },
        });
      }
    }

    return {
      projectId: project.id,
      projectSlug: project.slug,
      projectName: project.name,
      usersCreated,
      usersReused,
      boards: boardIdMap.size,
      tasks: taskIdMap.size,
      members: memberUserIds.size,
      filesRestored,
      filesSkipped,
    };
  }
}

export const projectBackupService = new ProjectBackupService();
