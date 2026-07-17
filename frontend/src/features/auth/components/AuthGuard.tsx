'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';

function getRedirectPath(): string {
  if (typeof window === 'undefined') return '/dashboard';
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * Renders the protected shell immediately so route data can fetch in parallel
 * with /auth/me. Redirects only after session resolution fails.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirect = encodeURIComponent(getRedirectPath());
      router.replace(`/login?redirect=${redirect}`);
    }
  }, [isAuthenticated, isLoading, router]);

  if (!isLoading && !isAuthenticated) return null;

  return <>{children}</>;
}
