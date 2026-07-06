'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { App, Button as AntButton, Empty, Spin, Switch } from 'antd';
import { useNotifications } from '../hooks/useNotifications';
import { notificationService } from '../services/notification.service';
import type { AppNotification, NotificationPreferences } from '../types';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/Button';
import { getApiErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function NotificationItem({
  notification,
  highlighted,
  onClick,
}: {
  notification: AppNotification;
  highlighted: boolean;
  onClick: (notification: AppNotification) => void;
}) {
  const isUnread = !notification.readAt;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={cn(
        'w-full rounded-xl border px-4 py-3 text-left transition hover:border-primary-200 hover:bg-primary-50/40',
        isUnread
          ? 'border-primary-200 bg-primary-50/60'
          : 'border-gray-200 bg-white',
        highlighted && 'ring-2 ring-primary-400 ring-offset-2',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {notification.title}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-gray-600">
            {notification.body}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-xs text-gray-400">
            {formatRelativeTime(notification.createdAt)}
          </span>
          {isUnread && (
            <span className="rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              New
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function NotificationsView() {
  const { message } = App.useApp();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id');
  const {
    unreadCount,
    markAllRead,
    handleNotificationClick,
    permission,
    isPushSupported,
    enableNotifications,
    refreshUnreadCount,
  } = useNotifications();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const hasUnreadNotifications =
    unreadCount > 0 || notifications.some((item) => !item.readAt);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await notificationService.list({ page: 1, limit: 50 });
      setNotifications(result.items);
      await refreshUnreadCount();
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [message, refreshUnreadCount]);

  const loadPreferences = useCallback(async () => {
    try {
      const result = await notificationService.getPreferences();
      setPreferences(result);
    } catch {
      setPreferences(null);
    }
  }, []);

  useEffect(() => {
    void loadNotifications().finally(() => {
      hasLoadedOnceRef.current = true;
    });
    void loadPreferences();
  }, [loadNotifications, loadPreferences]);

  useEffect(() => {
    if (!hasLoadedOnceRef.current || isLoading) return;

    void (async () => {
      try {
        const result = await notificationService.list({ page: 1, limit: 50 });
        setNotifications(result.items);
      } catch {
        // Keep the current list if the silent refresh fails.
      }
    })();
  }, [isLoading, unreadCount]);

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllRead();
      setNotifications((current) =>
        current.map((item) =>
          item.readAt ? item : { ...item, readAt: new Date().toISOString() },
        ),
      );
      message.success('All notifications marked as read');
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleItemClick = (notification: AppNotification) => {
    if (!notification.readAt) {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
    }

    handleNotificationClick(notification);
  };

  const updatePreference = async (
    key: keyof Pick<
      NotificationPreferences,
      'taskChanges' | 'groupMessages' | 'pushEnabled'
    >,
    value: boolean,
  ) => {
    if (!preferences) return;

    setIsSavingPreferences(true);
    const previous = preferences;

    try {
      const next = await notificationService.updatePreferences({
        [key]: value,
      });
      setPreferences(next);
      message.success('Notification preferences updated');
    } catch (error) {
      setPreferences(previous);
      message.error(getApiErrorMessage(error));
    } finally {
      setIsSavingPreferences(false);
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-600">
            Task updates, group messages, and push alerts across desktop and
            mobile.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'You are all caught up'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {isPushSupported && permission !== 'granted' && (
              <AntButton onClick={() => void enableNotifications()}>
                Enable push notifications
              </AntButton>
            )}
            <Button
              disabled={!hasUnreadNotifications}
              isLoading={isMarkingAll}
              onClick={() => void handleMarkAllRead()}
            >
              Mark all as read
            </Button>
          </div>
        </div>

        {preferences && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">Preferences</h2>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                <span>Task changes</span>
                <Switch
                  checked={preferences.taskChanges}
                  disabled={isSavingPreferences}
                  onChange={(checked) =>
                    void updatePreference('taskChanges', checked)
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                <span>Group messages</span>
                <Switch
                  checked={preferences.groupMessages}
                  disabled={isSavingPreferences}
                  onChange={(checked) =>
                    void updatePreference('groupMessages', checked)
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                <span>Push notifications</span>
                <Switch
                  checked={preferences.pushEnabled}
                  disabled={isSavingPreferences}
                  onChange={(checked) =>
                    void updatePreference('pushEnabled', checked)
                  }
                />
              </label>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spin size="large" />
          </div>
        ) : notifications.length === 0 ? (
          <Empty description="No notifications yet" />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                highlighted={highlightId === notification.id}
                onClick={(item) => void handleItemClick(item)}
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
