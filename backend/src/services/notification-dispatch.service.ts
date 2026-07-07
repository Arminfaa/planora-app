import type { BoardEventType } from '../socket/types';
import type { ProjectEventType } from '../socket/types';
import { translateNotification } from '../i18n/translate';
import { normalizeLocale, type Locale } from '../i18n/types';
import { boardRepository } from '../repositories/board.repository';
import { notificationPreferenceRepository } from '../repositories/notification-preference.repository';
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

async function getActorName(actorId: string, locale: Locale): Promise<string> {
  const user = await userRepository.findById(actorId);
  return (
    user?.name ?? translateNotification('notification.fallback.someone', locale)
  );
}

async function getRecipientLocales(
  recipientIds: string[],
): Promise<Map<string, Locale>> {
  const preferences =
    await notificationPreferenceRepository.findByUserIds(recipientIds);
  const localeByUserId = new Map<string, Locale>();

  for (const preference of preferences) {
    localeByUserId.set(
      preference.userId,
      normalizeLocale(preference.preferredLocale),
    );
  }

  for (const userId of recipientIds) {
    if (!localeByUserId.has(userId)) {
      localeByUserId.set(userId, 'en');
    }
  }

  return localeByUserId;
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
  locale: Locale,
): { title: string; slug?: string; columnName: string } | null {
  if (!payload || typeof payload !== 'object') return null;

  const columns = (payload as { columns?: unknown }).columns;
  if (!Array.isArray(columns)) return null;

  for (const column of columns) {
    if (!column || typeof column !== 'object') continue;

    const columnRecord = column as Record<string, unknown>;
    const columnName =
      typeof columnRecord.name === 'string'
        ? columnRecord.name
        : translateNotification('notification.fallback.column', locale);
    const tasks = columnRecord.tasks;

    if (!Array.isArray(tasks)) continue;

    for (const task of tasks) {
      if (!task || typeof task !== 'object') continue;
      const taskRecord = task as Record<string, unknown>;
      if (taskRecord.id !== taskId) continue;

      return {
        title:
          typeof taskRecord.title === 'string'
            ? taskRecord.title
            : translateNotification('notification.fallback.task', locale),
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
  locale: Locale,
  moveDetails?: { fromColumnName?: string; toColumnName?: string },
): { title: string; body: string } {
  const taskLabel = quoteTaskTitle(taskTitle);
  const baseVars = { actorName, taskTitle: taskLabel, boardName };

  switch (type) {
    case 'task:created':
      return {
        title: translateNotification(
          'notification.task.created.title',
          locale,
          {
            boardName,
          },
        ),
        body: translateNotification('notification.task.created.body', locale, {
          ...baseVars,
        }),
      };
    case 'task:updated':
      return {
        title: translateNotification(
          'notification.task.updated.title',
          locale,
          {
            boardName,
          },
        ),
        body: translateNotification('notification.task.updated.body', locale, {
          ...baseVars,
        }),
      };
    case 'task:moved': {
      const { fromColumnName, toColumnName } = moveDetails ?? {};
      if (fromColumnName && toColumnName) {
        return {
          title: translateNotification(
            'notification.task.moved.title',
            locale,
            {
              boardName,
            },
          ),
          body: translateNotification(
            'notification.task.moved.fromTo.body',
            locale,
            {
              ...baseVars,
              fromColumnName,
              toColumnName,
            },
          ),
        };
      }
      if (toColumnName) {
        return {
          title: translateNotification(
            'notification.task.moved.title',
            locale,
            {
              boardName,
            },
          ),
          body: translateNotification(
            'notification.task.moved.to.body',
            locale,
            {
              ...baseVars,
              toColumnName,
            },
          ),
        };
      }
      return {
        title: translateNotification('notification.task.moved.title', locale, {
          boardName,
        }),
        body: translateNotification('notification.task.moved.body', locale, {
          ...baseVars,
        }),
      };
    }
    case 'task:deleted':
      return {
        title: translateNotification(
          'notification.task.deleted.title',
          locale,
          {
            boardName,
          },
        ),
        body: translateNotification('notification.task.deleted.body', locale, {
          ...baseVars,
        }),
      };
    default:
      return {
        title: translateNotification(
          'notification.task.default.title',
          locale,
          {
            boardName,
          },
        ),
        body: translateNotification('notification.task.default.body', locale, {
          ...baseVars,
        }),
      };
  }
}

async function resolveTaskDetails(
  type: TaskEventType,
  payload: unknown,
  taskId: string | undefined,
  locale: Locale,
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
      const fromColumns = findTaskInColumns(payload, taskId, locale);
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

  const [project, boardMeta, recipientIds] = await Promise.all([
    projectRepository.findById(projectId),
    boardRepository.findSlugById(options.boardId),
    getProjectRecipients(projectId, actorId),
  ]);

  if (!project || !boardMeta || recipientIds.length === 0) return;

  const localeByUserId = await getRecipientLocales(recipientIds);
  const actorNameByLocale = new Map<Locale, string>();

  await Promise.all(
    recipientIds.map(async (userId) => {
      const locale = localeByUserId.get(userId) ?? 'en';
      if (!actorNameByLocale.has(locale)) {
        actorNameByLocale.set(locale, await getActorName(actorId, locale));
      }

      const actorName = actorNameByLocale.get(locale)!;
      const taskDetails = await resolveTaskDetails(
        type,
        options.payload,
        options.taskId,
        locale,
      );

      const taskTitle =
        taskDetails?.title ??
        translateNotification('notification.fallback.task', locale);
      const href = taskDetails?.slug
        ? `/dashboard/projects/${project.slug}/boards/${boardMeta.slug}?task=${encodeURIComponent(taskDetails.slug)}`
        : `/dashboard/projects/${project.slug}/boards/${boardMeta.slug}`;

      const { title, body } = buildTaskNotificationCopy(
        type,
        actorName,
        taskTitle,
        boardMeta.name,
        locale,
        taskDetails?.moveDetails,
      );

      return deliverNotificationToUser({
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
      });
    }),
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

  const [project, recipientIds] = await Promise.all([
    projectRepository.findById(options.projectId),
    getProjectRecipients(options.projectId, actorId),
  ]);

  if (!project || recipientIds.length === 0) return;

  const localeByUserId = await getRecipientLocales(recipientIds);
  const actorNameByLocale = new Map<Locale, string>();

  await Promise.all(
    recipientIds.map(async (userId) => {
      const locale = localeByUserId.get(userId) ?? 'en';
      if (!actorNameByLocale.has(locale)) {
        actorNameByLocale.set(locale, await getActorName(actorId, locale));
      }

      const actorName = actorNameByLocale.get(locale)!;
      const authorName = message.author?.name ?? actorName;
      const preview = truncate(
        message.content?.trim() ||
          translateNotification('notification.fallback.message', locale),
      );
      const title = translateNotification(
        'notification.group.created.title',
        locale,
        { projectName: project.name },
      );
      const body = translateNotification(
        'notification.group.created.body',
        locale,
        { authorName, preview },
      );
      const href = `/dashboard/projects/${project.slug}/group`;

      return deliverNotificationToUser({
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
      });
    }),
  );
}
