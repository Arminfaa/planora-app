'use client';

import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { NotificationPermissionBanner } from '@/features/notifications/components/NotificationPermissionBanner';
import { MarkNotificationFromUrl } from '@/features/notifications/components/MarkNotificationFromUrl';
import { Header } from '@/shared/components/layout/Header';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <MarkNotificationFromUrl />
        <Header />
        <NotificationPermissionBanner />
        <main>{children}</main>
      </div>
    </AuthGuard>
  );
}
