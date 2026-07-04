'use client';

import { AuthProvider } from '@/features/auth/hooks/useAuth';
import { AntdProvider } from '@/lib/antd';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdProvider>
      <AuthProvider>{children}</AuthProvider>
    </AntdProvider>
  );
}
