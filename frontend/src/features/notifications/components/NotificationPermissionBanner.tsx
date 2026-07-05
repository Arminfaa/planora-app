'use client';

import { useCallback, useState, type MouseEvent } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components/ui/Button';
import { useNotificationPromptState } from '../hooks/useNotificationPromptState';
import { useNotifications } from '../hooks/useNotifications';

export function NotificationPermissionBanner() {
  const { user } = useAuth();
  const { enableNotifications, enablePushForAccount } = useNotifications();
  const {
    bannerVariant,
    markOptedIn,
    markOptedOut,
    dismissForSession,
    refresh,
  } = useNotificationPromptState();
  const [isEnabling, setIsEnabling] = useState(false);

  const handleSuccess = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        markOptedIn();
      }
      void refresh();
    },
    [markOptedIn, refresh],
  );

  const handleDeclined = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      markOptedOut();
    },
    [markOptedOut],
  );

  const handleNotNow = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      dismissForSession();
    },
    [dismissForSession],
  );

  if (!user?.id || bannerVariant === 'none') {
    return null;
  }

  if (bannerVariant === 'blocked') {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
          <p>
            Notifications are blocked in your browser. Open site settings to
            allow alerts for {user.name.split(' ')[0] || 'your account'}.
          </p>
          <Button
            type="button"
            variant="ghost"
            className="!text-amber-900"
            onClick={handleDeclined}
          >
            Don&apos;t ask again
          </Button>
        </div>
      </div>
    );
  }

  if (bannerVariant === 'account') {
    return (
      <div className="border-b border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-950">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
          <p>
            Turn on push notifications for{' '}
            <span className="font-semibold">{user.name}</span> on this device.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="!text-primary-900"
              onClick={handleNotNow}
            >
              Not now
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="!text-primary-900"
              onClick={handleDeclined}
            >
              Don&apos;t ask again
            </Button>
            <Button
              type="button"
              isLoading={isEnabling}
              onClick={() => {
                setIsEnabling(true);
                void enablePushForAccount()
                  .then(handleSuccess)
                  .finally(() => setIsEnabling(false));
              }}
            >
              Enable for my account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-950">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
        <p>
          Enable notifications to get alerts for task changes and project group
          messages on desktop and mobile.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="!text-primary-900"
            onClick={handleNotNow}
          >
            Not now
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="!text-primary-900"
            onClick={handleDeclined}
          >
            Don&apos;t ask again
          </Button>
          <Button
            type="button"
            isLoading={isEnabling}
            onClick={() => {
              setIsEnabling(true);
              void enableNotifications()
                .then(handleSuccess)
                .finally(() => setIsEnabling(false));
            }}
          >
            Enable notifications
          </Button>
        </div>
      </div>
    </div>
  );
}
