import { api } from '@/lib/api';
import type {
  AppNotification,
  NotificationListResult,
  NotificationPreferences,
  PushStatus,
} from '../types';

export const notificationService = {
  async list(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationListResult> {
    const response = await api.get<{ data: NotificationListResult }>(
      '/notifications',
      { params },
    );
    return response.data.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ data: { unreadCount: number } }>(
      '/notifications/unread-count',
    );
    return response.data.data.unreadCount;
  },

  async markRead(
    id: string,
  ): Promise<{ notification: AppNotification; unreadCount: number }> {
    const response = await api.patch<{
      data: { notification: AppNotification; unreadCount: number };
    }>(`/notifications/${id}/read`);
    return response.data.data;
  },

  async markAllRead(): Promise<{ updatedCount: number; unreadCount: number }> {
    const response = await api.patch<{
      data: { updatedCount: number; unreadCount: number };
    }>('/notifications/read-all');
    return response.data.data;
  },

  async getVapidPublicKey(): Promise<string | null> {
    const response = await api.get<{ data: { publicKey: string | null } }>(
      '/notifications/push/vapid-key',
    );
    return response.data.data.publicKey;
  },

  async getPushStatus(endpoint?: string | null): Promise<PushStatus> {
    const response = await api.get<{ data: PushStatus }>(
      '/notifications/push/status',
      {
        params: endpoint ? { endpoint } : undefined,
      },
    );
    return response.data.data;
  },

  async subscribePush(subscription: PushSubscriptionJSON): Promise<void> {
    if (!subscription.endpoint || !subscription.keys) {
      throw new Error('Invalid push subscription');
    }

    await api.post('/notifications/push/subscribe', {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    });
  },

  async unsubscribePush(endpoint: string): Promise<void> {
    await api.delete('/notifications/push/subscribe', {
      data: { endpoint },
    });
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get<{ data: NotificationPreferences }>(
      '/notifications/preferences',
    );
    return response.data.data;
  },

  async updatePreferences(
    input: Partial<
      Pick<
        NotificationPreferences,
        'taskChanges' | 'groupMessages' | 'pushEnabled'
      >
    >,
  ): Promise<NotificationPreferences> {
    const response = await api.patch<{ data: NotificationPreferences }>(
      '/notifications/preferences',
      input,
    );
    return response.data.data;
  },
};
