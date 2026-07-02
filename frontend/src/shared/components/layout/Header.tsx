'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components/ui/Button';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="text-lg font-semibold text-gray-900">
          {process.env.NEXT_PUBLIC_APP_NAME ?? 'Project Management'}
        </Link>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-gray-600 sm:block">
            {user?.name}
          </span>
          <Button variant="secondary" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
