import type { BoardEventType } from '../socket/types';
import type { ProjectEventType } from '../socket/types';
import { boardRepository } from '../repositories/board.repository';
import { projectRepository } from '../repositories/project.repository';
import { projectMemberRepository } from '../repositories/project-member.repository';
import { taskRepository } from '../repositories/task.repository';
import { userRepository } from '../repositories/user.repository';
import { deliverNotificationToUser } from './notification.service';
import { logger } from '../utils/logger';

type GroupMessageEventType = Extract<
  ProjectEventType,
  'group:message:created' | 'group:message:updated' | 'group:message:deleted'
>;

type TaskEventType = Extract<
  BoardEventType,
  'task:created' | 'task:updated' | 'task:moved' | 'task:deleted'
>;

function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function quoteTaskTitle(title: string): string {
  return `«${truncate(title, 80)}»`;
}

async function getActorName(actorId: string): Promise<string> {
  const user = await userRepository.findById(actorId);
  return user?.name ?? 'Someone';
}

async function getProjectRecipients(
  projectId: string,
  actorId: string,
): Promise<string[]> {
  const members = await projectMemberRepository.findMembersByProject(projectId);
  const project = await projectRepository.findById(projectId);
  const userIds = new Set<string>();

  if (project?.ownerId && project.ownerId !== actorId) {
    userIds.add(project.ownerId);
  }

  for (const member of members) {
    if (member.userId !== actorId) {
      userIds.add(member.userId);
    }
  }

  return Array.from(userIds);
}

function extractTaskFromPayload(payload: unknown): {
  id?: string;
  slug?: string;
  title?: string;
  columnId?: string;
} | null {
  if (!payload || typeof payload !== 'object') return null;

  const record = payload as Record<string, unknown>;
  if (!record.task || typeof record.task !== 'object') return null;

  const task = record.task as Record<string, unknown>;
  return {
    id: typeof task.id === 'string' ? task.id : undefined,
    slug: typeof task.slug === 'string' ? task.slug : undefined,
    title: typeof task.title === 'string' ? task.title : undefined,
    columnId: typeof task.columnId === 'string' ? task.columnId : undefined,
  };
}

function extractMoveColumns(payload: unknown): {
  fromColumnName?: string;
  toColumnName?: string;
} {
  if (!payload || typeof payload !== 'object') return {};

  const record = payload as Record<string, unknown>;
  return {
    fromColumnName:
      typeof record.fromColumnName === 'string'
        ? record.fromColumnName
        : undefined,
    toColumnName:
      typeof record.toColumnName === 'string' ? record.toColumnName : undefined,
  };
}

function findTaskInColumns(
  payload: unknown,
  taskId: string,
): { title: string; slug?: string; columnName: string } | null {
  if (!payload || typeof payload !== 'object') return null;

  const columns = (payload as { columns?: unknown }).columns;
  if (!Array.isArray(columns)) return null;

  for (const column of columns) {
    if (!column || typeof column !== 'object') continue;

    const columnRecord = column as Record<string, unknown>;
    const columnName =
      typeof columnRecord.name === 'string' ? columnRecord.name : 'Column';
    const tasks = columnRecord.tasks;

    if (!Array.isArray(tasks)) continue;

    for (const task of tasks) {
      if (!task || typeof task !== 'object') continue;
      const taskRecord = task as Record<string, unknown>;
      if (taskRecord.id !== taskId) continue;

      return {
        title: typeof taskRecord.title === 'string' ? taskRecord.title : 'Task',
        slug: typeof taskRecord.slug === 'string' ? taskRecord.slug : undefined,
        columnName,
      };
    }
  }

  return null;
}

function buildTaskNotificationCopy(
  type: TaskEventType,
  actorName: string,
  taskTitle: string,
  boardName: string,
  moveDetails?: { fromColumnName?: string; toColumnName?: string },
): { title: string; body: string } {
  const taskLabel = quoteTaskTitle(taskTitle);

  switch (type) {
    case 'task:created':
      return {
        title: `New task on ${boardName}`,
        body: `${actorName} created ${taskLabel}`,
      };
    case 'task:updated':
      return {
        title: `Task updated on ${boardName}`,
        body: `${actorName} updated ${taskLabel}`,
      };
    case 'task:moved': {
      const { fromColumnName, toColumnName } = moveDetails ?? {};
      if (fromColumnName && toColumnName) {
        return {
          title: `Task moved on ${boardName}`,
          body: `${actorName} moved ${taskLabel} from "${fromColumnName}" to "${toColumnName}"`,
        };
      }
      if (toColumnName) {
        return {
          title: `Task moved on ${boardName}`,
          body: `${actorName} moved ${taskLabel} to "${toColumnName}"`,
        };
      }
      return {
        title: `Task moved on ${boardName}`,
        body: `${actorName} moved ${taskLabel}`,
      };
    }
    case 'task:deleted':
      return {
        title: `Task deleted on ${boardName}`,
        body: `${actorName} deleted ${taskLabel}`,
      };
    default:
      return {
        title: `Task update on ${boardName}`,
        body: `${actorName} changed ${taskLabel}`,
      };
  }
}

async function resolveTaskDetails(
  type: TaskEventType,
  payload: unknown,
  taskId?: string,
): Promise<{
  id?: string;
  slug?: string;
  title: string;
  moveDetails?: { fromColumnName?: string; toColumnName?: string };
} | null> {
  const fromPayload = extractTaskFromPayload(payload);
  const moveMeta = type === 'task:moved' ? extractMoveColumns(payload) : {};

  if (fromPayload?.title) {
    return {
      id: fromPayload.id,
      slug: fromPayload.slug,
      title: fromPayload.title,
      moveDetails: moveMeta,
    };
  }

  if (taskId) {
    if (type === 'task:moved') {
      const fromColumns = findTaskInColumns(payload, taskId);
      if (fromColumns) {
        return {
          id: taskId,
          slug: fromColumns.slug,
          title: fromColumns.title,
          moveDetails: {
            toColumnName: fromColumns.columnName,
            ...moveMeta,
          },
        };
      }
    }

    const task = await taskRepository.findById(taskId);
    if (task) {
      return {
        id: task.id,
        slug: task.slug,
        title: task.title,
        moveDetails: moveMeta,
      };
    }
  }

  return null;
}

export async function dispatchBoardTaskNotifications(
  actorId: string,
  type: BoardEventType,
  options: {
    boardId: string;
    payload: unknown;
    taskId?: string;
  },
): Promise<void> {
  if (
    type !== 'task:created' &&
    type !== 'task:updated' &&
    type !== 'task:moved' &&
    type !== 'task:deleted'
  ) {
    return;
  }

  const projectId = await boardRepository.getProjectId(options.boardId);
  if (!projectId) return;

  const [project, boardMeta, actorName, recipientIds, taskDetails] =
    await Promise.all([
      projectRepository.findById(projectId),
      boardRepository.findSlugById(options.boardId),
      getActorName(actorId),
      getProjectRecipients(projectId, actorId),
      resolveTaskDetails(type, options.payload, options.taskId),
    ]);

  if (!project || !boardMeta || recipientIds.length === 0) return;

  const taskTitle = taskDetails?.title ?? 'a task';
  const href = taskDetails?.slug
    ? `/dashboard/projects/${project.slug}/boards/${boardMeta.slug}?task=${encodeURIComponent(taskDetails.slug)}`
    : `/dashboard/projects/${project.slug}/boards/${boardMeta.slug}`;

  const { title, body } = buildTaskNotificationCopy(
    type,
    actorName,
    taskTitle,
    boardMeta.name,
    taskDetails?.moveDetails,
  );

  await Promise.all(
    recipientIds.map((userId) =>
      deliverNotificationToUser({
        userId,
        type: type.toUpperCase().replace(':', '_') as
          'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_MOVED' | 'TASK_DELETED',
        title,
        body,
        href,
        projectId,
        boardId: options.boardId,
        taskId: taskDetails?.id ?? options.taskId ?? null,
        actorId,
      }).catch((error) => {
        logger.warn('Failed to deliver task notification', {
          userId,
          type,
          error: error instanceof Error ? error.message : String(error),
        });
      }),
    ),
  );
}

export async function dispatchProjectGroupMessageNotifications(
  actorId: string,
  type: GroupMessageEventType,
  options: {
    projectId: string;
    payload: unknown;
  },
): Promise<void> {
  if (type !== 'group:message:created') return;

  const payload = options.payload as {
    message?: {
      id?: string;
      type?: string;
      content?: string | null;
      author?: { name?: string };
    };
  };

  const message = payload.message;
  if (!message || message.type !== 'USER') return;

  const [project, actorName, recipientIds] = await Promise.all([
    projectRepository.findById(options.projectId),
    getActorName(actorId),
    getProjectRecipients(options.projectId, actorId),
  ]);

  if (!project || recipientIds.length === 0) return;

  const preview = truncate(message.content?.trim() || 'Sent a message');
  const title = `New group message · ${project.name}`;
  const body = `${message.author?.name ?? actorName}: ${preview}`;
  const href = `/dashboard/projects/${project.slug}/group`;

  await Promise.all(
    recipientIds.map((userId) =>
      deliverNotificationToUser({
        userId,
        type: 'GROUP_MESSAGE',
        title,
        body,
        href,
        projectId: options.projectId,
        actorId,
      }).catch((error) => {
        logger.warn('Failed to deliver group message notification', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }),
    ),
  );
}
