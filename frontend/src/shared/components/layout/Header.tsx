'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components/ui/Button';

const GlobalSearch = dynamic(
  () =>
    import('@/features/search/components/GlobalSearch').then((mod) => ({
      default: mod.GlobalSearch,
    })),
  { ssr: false },
);

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="shrink-0 text-lg font-semibold text-gray-900"
        >
          {process.env.NEXT_PUBLIC_APP_NAME ?? 'Project Management'}
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <GlobalSearch />
        </div>

        <div className="ml-auto flex items-center gap-4">
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
