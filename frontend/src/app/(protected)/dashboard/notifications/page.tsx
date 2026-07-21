import { Suspense } from 'react';
import { NotificationsView } from '@/features/notifications/components/NotificationsView';
import { NotificationsSkeleton } from '@/features/notifications/components/NotificationsSkeleton';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata('Notifications');

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationsSkeleton />}>
      <NotificationsView />
    </Suspense>
  );
}
