'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowsAuthenticated = pathname?.startsWith('/accept-invite');

  useEffect(() => {
    if (!isLoading && isAuthenticated && !allowsAuthenticated) {
      router.replace('/dashboard');
    }
  }, [allowsAuthenticated, isAuthenticated, isLoading, router]);

  if (isLoading) return <LoadingSpinner />;
  if (isAuthenticated && !allowsAuthenticated) return null;

  return <>{children}</>;
}
