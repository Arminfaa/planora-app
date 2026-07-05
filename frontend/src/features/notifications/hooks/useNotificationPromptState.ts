'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { notificationService } from '../services/notification.service';
import type { PushStatus } from '../types';
import {
  isSessionPromptDismissed,
  resolveNotificationPromptBanner,
  setSessionPromptDismissed,
  type NotificationPromptBannerVariant,
} from '../lib/notification-prompt-storage';
import {
  getCurrentPushEndpoint,
  getNotificationPermission,
  isPushSupported,
} from '../lib/push-client';
import { useNotificationPromptStorage } from './useNotificationPromptStorage';

const defaultPushStatus: PushStatus = {
  pushEnabled: true,
  subscribedOnThisDevice: false,
  subscriptionCount: 0,
};

export function useNotificationPromptState() {
  const { user } = useAuth();
  const userId = user?.id;
  const { record, markOptedIn, markOptedOut, clearRecord } =
    useNotificationPromptStorage(userId);
  const [permission, setPermission] = useState<
    NotificationPermission | 'unsupported'
  >('default');
  const [pushStatus, setPushStatus] = useState<PushStatus>(defaultPushStatus);
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId || !isPushSupported()) {
      setPermission('unsupported');
      setPushStatus(defaultPushStatus);
      setSessionDismissed(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [nextPermission, endpoint] = await Promise.all([
        getNotificationPermission(),
        getCurrentPushEndpoint(),
      ]);

      setPermission(nextPermission);
      setSessionDismissed(isSessionPromptDismissed(userId));

      const status = await notificationService.getPushStatus(endpoint);
      setPushStatus(status);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const bannerVariant: NotificationPromptBannerVariant =
    !userId || !isPushSupported() || isLoading
      ? 'none'
      : resolveNotificationPromptBanner({
          permission,
          pushEnabled: pushStatus.pushEnabled,
          subscribedOnThisDevice: pushStatus.subscribedOnThisDevice,
          record,
          sessionDismissed,
        });

  const dismissForSession = useCallback(() => {
    if (!userId) return;
    setSessionPromptDismissed(userId);
    setSessionDismissed(true);
  }, [userId]);

  return {
    userId,
    permission,
    pushStatus,
    record,
    bannerVariant,
    isLoading,
    markOptedIn,
    markOptedOut,
    clearRecord,
    dismissForSession,
    refresh,
  };
}
