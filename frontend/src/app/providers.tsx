'use client';

import { AuthProvider } from '@/features/auth/hooks/useAuth';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>{children}</AuthProvider>
    </ErrorBoundary>
  );
}
