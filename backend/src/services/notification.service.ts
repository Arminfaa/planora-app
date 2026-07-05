import type { Notification } from '@prisma/client';
import { emitNotificationEvent } from '../socket/notification.events';
import { notificationRepository } from '../repositories/notification.repository';
import { notificationPreferenceRepository } from '../repositories/notification-preference.repository';
import { pushSubscriptionRepository } from '../repositories/push-subscription.repository';
import { userRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/ApiError';
import { buildPagination } from '../utils/pagination';
import { sendPushToUser } from './push-notification.service';
import type {
  ListNotificationsQuery,
  SubscribePushInput,
  UnsubscribePushInput,
  UpdateNotificationPreferencesInput,
} from '../validators/notification.validator';

function serializeNotification(
  notification: Notification & {
    actor?: { id: string; name: string; avatar: string | null } | null;
  },
) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    href: notification.href,
    projectId: notification.projectId,
    boardId: notification.boardId,
    taskId: notification.taskId,
    actorId: notification.actorId,
    actor: notification.actor ?? null,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}

class NotificationService {
  async list(userId: string, query: ListNotificationsQuery) {
    const { items, total } = await notificationRepository.findByUser(
      userId,
      query.page,
      query.limit,
      { unreadOnly: query.unreadOnly },
    );

    const unreadCount = await notificationRepository.countUnread(userId);

    return {
      ...buildPagination(
        items.map((item) => serializeNotification(item)),
        total,
        query.page,
        query.limit,
      ),
      unreadCount,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.countUnread(userId);
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await notificationRepository.markRead(
      notificationId,
      userId,
    );
    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    const unreadCount = await notificationRepository.countUnread(userId);

    emitNotificationEvent(userId, {
      type: 'notification:read',
      notificationId,
      unreadCount,
    });

    return {
      notification: serializeNotification(notification),
      unreadCount,
    };
  }

  async markAllRead(userId: string) {
    const count = await notificationRepository.markAllRead(userId);

    emitNotificationEvent(userId, {
      type: 'notification:read-all',
      unreadCount: 0,
    });

    return { updatedCount: count, unreadCount: 0 };
  }

  async subscribePush(userId: string, input: SubscribePushInput) {
    const preference =
      await notificationPreferenceRepository.getOrCreate(userId);

    if (!preference.pushEnabled) {
      throw new ApiError(400, 'Push notifications are disabled in preferences');
    }

    const subscription = await pushSubscriptionRepository.upsert({
      userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: input.userAgent ?? null,
    });

    return {
      id: subscription.id,
      endpoint: subscription.endpoint,
    };
  }

  async unsubscribePush(userId: string, input: UnsubscribePushInput) {
    const removed = await pushSubscriptionRepository.deleteByEndpoint(
      userId,
      input.endpoint,
    );

    if (!removed) {
      throw new ApiError(404, 'Push subscription not found');
    }

    return { success: true };
  }

  async getPreferences(userId: string) {
    const preference =
      await notificationPreferenceRepository.getOrCreate(userId);

    return {
      taskChanges: preference.taskChanges,
      groupMessages: preference.groupMessages,
      pushEnabled: preference.pushEnabled,
      updatedAt: preference.updatedAt.toISOString(),
    };
  }

  async updatePreferences(
    userId: string,
    input: UpdateNotificationPreferencesInput,
  ) {
    const preference = await notificationPreferenceRepository.update(
      userId,
      input,
    );

    if (input.pushEnabled === false) {
      const subscriptions = await pushSubscriptionRepository.findByUser(userId);
      if (subscriptions.length > 0) {
        await pushSubscriptionRepository.deleteByIdList(
          subscriptions.map((item) => item.id),
        );
      }
    }

    return {
      taskChanges: preference.taskChanges,
      groupMessages: preference.groupMessages,
      pushEnabled: preference.pushEnabled,
      updatedAt: preference.updatedAt.toISOString(),
    };
  }
}

export const notificationService = new NotificationService();

export interface CreateNotificationInput {
  userId: string;
  type: Notification['type'];
  title: string;
  body: string;
  href: string;
  projectId?: string | null;
  boardId?: string | null;
  taskId?: string | null;
  actorId?: string | null;
}

export async function deliverNotificationToUser(
  input: CreateNotificationInput,
): Promise<void> {
  const preference = await notificationPreferenceRepository.getOrCreate(
    input.userId,
  );

  const isTaskNotification = input.type.startsWith('TASK_');
  if (isTaskNotification && !preference.taskChanges) return;
  if (input.type === 'GROUP_MESSAGE' && !preference.groupMessages) return;

  const notification = await notificationRepository.create(input);
  const actor = input.actorId
    ? await userRepository.findById(input.actorId)
    : null;
  const serialized = serializeNotification({
    ...notification,
    actor: actor
      ? { id: actor.id, name: actor.name, avatar: actor.avatar }
      : null,
  });
  const unreadCount = await notificationRepository.countUnread(input.userId);

  emitNotificationEvent(input.userId, {
    type: 'notification:created',
    notification: serialized,
    unreadCount,
  });

  if (!preference.pushEnabled) return;

  await sendPushToUser(input.userId, {
    title: input.title,
    body: input.body,
    href: input.href,
    notificationId: notification.id,
    tag: notification.id,
  });
}
