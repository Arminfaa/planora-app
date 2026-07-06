import { getSocketServer } from './io';
import { getUserRoom } from './types';

export interface NotificationSocketEvent {
  type:
    | 'notification:created'
    | 'notification:read'
    | 'notification:read-all'
    | 'notification:read-batch';
  notification?: {
    id: string;
    type: string;
    title: string;
    body: string;
    href: string;
    projectId: string | null;
    boardId: string | null;
    taskId: string | null;
    actorId: string | null;
    actor: { id: string; name: string; avatar: string | null } | null;
    readAt: string | null;
    createdAt: string;
  };
  notificationId?: string;
  projectId?: string;
  notificationType?: string;
  unreadCount: number;
}

export function emitNotificationEvent(
  userId: string,
  event: NotificationSocketEvent,
): void {
  getSocketServer().to(getUserRoom(userId)).emit('notification:event', event);
}
