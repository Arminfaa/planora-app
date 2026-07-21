'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button as AntButton, Empty, Switch } from 'antd';
import { useNotifications } from '../hooks/useNotifications';
import { notificationService } from '../services/notification.service';
import type { AppNotification, NotificationPreferences } from '../types';
import { NotificationsListSkeleton } from '@/features/notifications/components/NotificationsSkeleton';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Button } from '@/shared/components/ui/Button';
import { getApiErrorMessage } from '@/lib/api';
import { queryKeys, STALE_TIME } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { useLocale } from '@/i18n/LocaleProvider';
import type { Translator } from '@/i18n/utils';

function formatRelativeTime(value: string, t: Translator): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return t('notifications.relativeTime.justNow');
  if (diffMinutes < 60) {
    return t('notifications.relativeTime.minutesAgo', { count: diffMinutes });
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return t('notifications.relativeTime.hoursAgo', { count: diffHours });
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return t('notifications.relativeTime.daysAgo', { count: diffDays });
  }

  return date.toLocaleDateString();
}

function NotificationItem({
  notification,
  highlighted,
  onClick,
  t,
}: {
  notification: AppNotification;
  highlighted: boolean;
  onClick: (notification: AppNotification) => void;
  t: Translator;
}) {
  const isUnread = !notification.readAt;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={cn(
        'w-full rounded-xl border px-4 py-3 text-start transition hover:border-primary-200 hover:bg-primary-50/40',
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
            {formatRelativeTime(notification.createdAt, t)}
          </span>
          {isUnread && (
            <span className="rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {t('notifications.new')}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function NotificationsView() {
  const { message } = App.useApp();
  const { t } = useLocale();
  const queryClient = useQueryClient();
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

  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const syncedUnreadCountRef = useRef<number | null>(null);

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications.list(1, 50),
    queryFn: () => notificationService.list({ page: 1, limit: 50 }),
    staleTime: STALE_TIME.notificationsList,
  });

  const notifications = notificationsQuery.data?.items ?? [];

  const hasUnreadNotifications =
    unreadCount > 0 || notifications.some((item) => !item.readAt);

  const loadPreferences = useCallback(async () => {
    try {
      const result = await notificationService.getPreferences();
      setPreferences(result);
    } catch {
      setPreferences(null);
    }
  }, []);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    const listUnreadCount = notificationsQuery.data?.unreadCount;
    if (listUnreadCount === undefined) return;
    if (syncedUnreadCountRef.current === listUnreadCount) return;

    syncedUnreadCountRef.current = listUnreadCount;
    void refreshUnreadCount();
  }, [notificationsQuery.data?.unreadCount, refreshUnreadCount]);

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllRead();
      await queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
      await notificationsQuery.refetch();
      await refreshUnreadCount();
      message.success(t('notifications.markAllReadSuccess'));
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleItemClick = (notification: AppNotification) => {
    if (!notification.readAt) {
      queryClient.setQueryData(
        queryKeys.notifications.list(1, 50),
        (
          current:
            Awaited<ReturnType<typeof notificationService.list>> | undefined,
        ) => {
          if (!current) return current;

          return {
            ...current,
            items: current.items.map((item) =>
              item.id === notification.id
                ? { ...item, readAt: new Date().toISOString() }
                : item,
            ),
            unreadCount: Math.max(0, current.unreadCount - 1),
          };
        },
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
      message.success(t('notifications.preferencesUpdated'));
    } catch (error) {
      setPreferences(previous);
      message.error(getApiErrorMessage(error));
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const isLoading = notificationsQuery.isLoading;

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('notifications.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {t('notifications.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {unreadCount > 0
              ? unreadCount === 1
                ? t('notifications.unread', { count: unreadCount })
                : t('notifications.unreadPlural', { count: unreadCount })
              : t('notifications.allCaughtUp')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {isPushSupported && permission !== 'granted' && (
              <AntButton onClick={() => void enableNotifications()}>
                {t('notifications.enablePush')}
              </AntButton>
            )}
            <Button
              disabled={!hasUnreadNotifications}
              isLoading={isMarkingAll}
              onClick={() => void handleMarkAllRead()}
            >
              {t('notifications.markAllRead')}
            </Button>
          </div>
        </div>

        {preferences && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">
              {t('notifications.preferences')}
            </h2>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                <span>{t('notifications.taskChanges')}</span>
                <Switch
                  checked={preferences.taskChanges}
                  disabled={isSavingPreferences}
                  onChange={(checked) =>
                    void updatePreference('taskChanges', checked)
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                <span>{t('notifications.groupMessages')}</span>
                <Switch
                  checked={preferences.groupMessages}
                  disabled={isSavingPreferences}
                  onChange={(checked) =>
                    void updatePreference('groupMessages', checked)
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-4 text-sm text-gray-700">
                <span>{t('notifications.pushNotifications')}</span>
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
          <NotificationsListSkeleton />
        ) : notifications.length === 0 ? (
          <Empty description={t('notifications.noNotifications')} />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                highlighted={highlightId === notification.id}
                onClick={(item) => void handleItemClick(item)}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
