'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { useNotifications } from '../hooks/useNotifications';

export function NotificationPermissionBanner() {
  const { permission, isPushSupported, enableNotifications } =
    useNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  if (dismissed || !isPushSupported || permission === 'granted') {
    return null;
  }

  if (permission === 'denied') {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p>
            Notifications are blocked in your browser. Enable them from site
            settings to get task and message alerts.
          </p>
          <Button
            type="button"
            variant="ghost"
            className="!text-amber-900"
            onClick={() => setDismissed(true)}
          >
            Dismiss
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-950">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <p>
          Enable notifications to get alerts for task changes and project group
          messages on desktop and mobile.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="!text-primary-900"
            onClick={() => setDismissed(true)}
          >
            Not now
          </Button>
          <Button
            type="button"
            isLoading={isEnabling}
            onClick={() => {
              setIsEnabling(true);
              void enableNotifications()
                .then((enabled) => {
                  if (enabled) setDismissed(true);
                })
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
