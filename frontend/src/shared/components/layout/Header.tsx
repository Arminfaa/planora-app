'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LocaleSwitcher } from '@/i18n/components/LocaleSwitcher';
import { useLocale } from '@/i18n/LocaleProvider';
import { UserMenuDropdown } from '@/shared/components/layout/UserMenuDropdown';
import { AppLogo } from '@/shared/components/ui/AppLogo';
import { cn } from '@/lib/utils';

const GlobalSearch = dynamic(
  () =>
    import('@/features/search/components/GlobalSearch').then((mod) => ({
      default: mod.GlobalSearch,
    })),
  { ssr: false },
);

function getHeaderNavLinks(
  pathname: string,
  t: (key: string) => string,
): Array<{ href: string; label: string }> {
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return [{ href: '/', label: t('header.home') }];
  }

  if (pathname.startsWith('/dashboard/profile')) {
    return [{ href: '/dashboard', label: t('header.dashboard') }];
  }

  if (pathname.startsWith('/dashboard/notifications')) {
    return [{ href: '/dashboard', label: t('header.dashboard') }];
  }

  if (pathname.startsWith('/dashboard/')) {
    return [
      { href: '/dashboard', label: t('header.dashboard') },
      { href: '/', label: t('header.home') },
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
  const { t } = useLocale();
  const { isLoading: authLoading, user } = useAuth();
  const navLinks = getHeaderNavLinks(pathname, t);

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
            <AppLogo className="rounded-lg" />
            <span className="hidden text-lg font-semibold text-gray-900 sm:inline">
              {t('common.appName')}
            </span>
          </Link>

          <LocaleSwitcher />

          {navLinks.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-2 border-s border-gray-200 ps-3"
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

        <div className="ms-auto flex items-center gap-3">
          {authLoading && !user ? (
            <div className="h-9 w-28 animate-pulse rounded-full bg-gray-100" />
          ) : (
            <UserMenuDropdown />
          )}
        </div>
      </div>
    </header>
  );
}
