'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { UserMenuDropdown } from '@/shared/components/layout/UserMenuDropdown';
import { cn } from '@/lib/utils';

const GlobalSearch = dynamic(
  () =>
    import('@/features/search/components/GlobalSearch').then((mod) => ({
      default: mod.GlobalSearch,
    })),
  { ssr: false },
);

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Project Management';

function getHeaderNavLinks(pathname: string) {
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return [{ href: '/', label: 'Home' }];
  }

  if (pathname.startsWith('/dashboard/profile')) {
    return [{ href: '/dashboard', label: 'Dashboard' }];
  }

  if (pathname.startsWith('/dashboard/')) {
    return [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/', label: 'Home' },
    ];
  }

  return [];
}

function isBoardKanbanPage(pathname: string) {
  return /^\/dashboard\/projects\/[^/]+\/boards\/[^/]+\/?$/.test(pathname);
}

function getHeaderContainerClass(pathname: string) {
  if (isBoardKanbanPage(pathname)) {
    return 'w-full';
  }

  if (pathname.startsWith('/dashboard')) {
    return 'w-full max-w-7xl';
  }

  return 'w-full';
}

export function Header() {
  const pathname = usePathname();
  const navLinks = getHeaderNavLinks(pathname);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div
        className={cn(
          'mx-auto flex h-16 items-center gap-4 px-4 sm:px-6',
          getHeaderContainerClass(pathname),
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="group flex shrink-0 items-center gap-2.5"
          >
            <img
              src="/logo.webp"
              alt={appName}
              className="h-8 w-8 shrink-0 rounded-lg object-contain shadow-sm shadow-primary-500/20 transition group-hover:shadow-md group-hover:shadow-primary-500/25"
            />
            <span className="hidden text-lg font-semibold text-gray-900 sm:inline">
              {appName}
            </span>
          </Link>

          {navLinks.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-2 border-l border-gray-200 pl-3"
            >
              {navLinks.map((link, index) => (
                <div
                  key={link.href}
                  className="flex min-w-0 items-center gap-2"
                >
                  {index > 0 && (
                    <span className="text-gray-300" aria-hidden>
                      /
                    </span>
                  )}
                  <Link
                    href={link.href}
                    className="truncate text-sm font-medium text-gray-600 transition hover:text-primary-600"
                  >
                    {link.label}
                  </Link>
                </div>
              ))}
            </nav>
          )}
        </div>

        <div className="hidden flex-1 justify-center md:flex">
          <GlobalSearch />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <UserMenuDropdown />
        </div>
      </div>
    </header>
  );
}
