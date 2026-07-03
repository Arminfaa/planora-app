'use client';

import { AuthProvider } from '@/features/auth/hooks/useAuth';

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
