'use client';

import { AuthProvider } from '@/features/auth/hooks/useAuth';
import { NotificationProvider } from '@/features/notifications/hooks/useNotifications';
import { AntdProvider } from '@/lib/antd';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdProvider>
      <AuthProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </AuthProvider>
    </AntdProvider>
  );
}
