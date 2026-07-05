'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useNotifications } from '../hooks/useNotifications';

function MarkNotificationFromUrlInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { markRead } = useNotifications();
  const handledIds = useRef(new Set<string>());

  useEffect(() => {
    const notificationId = searchParams.get('notificationId');
    if (!notificationId) return;
    if (handledIds.current.has(notificationId)) return;

    handledIds.current.add(notificationId);

    void markRead(notificationId)
      .catch(() => undefined)
      .finally(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('notificationId');
        const nextQuery = params.toString();
        const nextPath = nextQuery ? `${pathname}?${nextQuery}` : pathname;
        router.replace(nextPath);
      });
  }, [markRead, pathname, router, searchParams]);

  return null;
}

export function MarkNotificationFromUrl() {
  return (
    <Suspense fallback={null}>
      <MarkNotificationFromUrlInner />
    </Suspense>
  );
}
