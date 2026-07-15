'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { getSafeRedirectPath } from '@/lib/authSession';

function GuestGuardContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allowsAuthenticated =
    pathname?.startsWith('/accept-invite') ||
    pathname?.startsWith('/reset-password');

  useEffect(() => {
    if (!isLoading && isAuthenticated && !allowsAuthenticated) {
      const safeRedirect = getSafeRedirectPath(searchParams.get('redirect'));
      router.replace(safeRedirect ?? '/dashboard');
    }
  }, [allowsAuthenticated, isAuthenticated, isLoading, router, searchParams]);

  if (isLoading) return <LoadingSpinner />;
  if (isAuthenticated && !allowsAuthenticated) return null;

  return <>{children}</>;
}

export function GuestGuard({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GuestGuardContent>{children}</GuestGuardContent>
    </Suspense>
  );
}
