import { Suspense } from 'react';
import { NotificationsView } from '@/features/notifications/components/NotificationsView';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';

export default function NotificationsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NotificationsView />
    </Suspense>
  );
}
