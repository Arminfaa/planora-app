export type NotificationType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_MOVED'
  | 'TASK_DELETED'
  | 'GROUP_MESSAGE';

export interface NotificationActor {
  id: string;
  name: string;
  avatar: string | null;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  projectId: string | null;
  boardId: string | null;
  taskId: string | null;
  actorId: string | null;
  actor: NotificationActor | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResult {
  items: AppNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

export interface NotificationPreferences {
  taskChanges: boolean;
  groupMessages: boolean;
  pushEnabled: boolean;
  updatedAt: string;
}

export interface PushStatus {
  pushEnabled: boolean;
  subscribedOnThisDevice: boolean;
  subscriptionCount: number;
}

export type NotificationSocketEvent =
  | {
      type: 'notification:created';
      notification: AppNotification;
      unreadCount: number;
    }
  | {
      type: 'notification:read';
      notificationId: string;
      unreadCount: number;
    }
  | {
      type: 'notification:read-all';
      unreadCount: number;
    }
  | {
      type: 'notification:read-batch';
      projectId: string;
      notificationType: NotificationType;
      unreadCount: number;
    };
