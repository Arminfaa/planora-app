'use client';

import { AuthProvider } from '@/features/auth/hooks/useAuth';
import { NotificationProvider } from '@/features/notifications/hooks/useNotifications';
import { LocaleHtmlAttributes } from '@/i18n/components/LocaleHtmlAttributes';
import { LocaleProvider } from '@/i18n/LocaleProvider';
import { AntdProvider } from '@/lib/antd';
import { QueryProvider } from '@/lib/QueryProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <LocaleProvider>
          <LocaleHtmlAttributes />
          <AntdProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </AntdProvider>
        </LocaleProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
