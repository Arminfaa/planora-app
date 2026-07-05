'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserMenuDropdown } from '@/shared/components/layout/UserMenuDropdown';
import { AppLogo, APP_NAME } from '@/shared/components/ui/AppLogo';
import { useHasMounted } from '@/shared/hooks/useHasMounted';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
];

export function LandingNavbar() {
  const { isAuthenticated, isLoading } = useAuth();
  const hasMounted = useHasMounted();
  const authed = hasMounted && !isLoading && isAuthenticated;

  return (
    <header className="sticky top-0 z-50 border-b border-white/30 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl min-[1400px]:max-w-[1380px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5">
          <AppLogo className="rounded-lg shadow-sm shadow-primary-500/25 transition group-hover:shadow-md group-hover:shadow-primary-500/30" />
          <span className="hidden truncate text-lg font-semibold text-gray-900 md:inline">
            {APP_NAME}
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100/80 hover:text-gray-900 sm:inline-flex"
            >
              {link.label}
            </Link>
          ))}

          {authed ? (
            <>
              <UserMenuDropdown />
              <Link
                href="/dashboard"
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-primary-600/20 transition hover:bg-primary-700"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 sm:px-4"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-primary-600/20 transition hover:bg-primary-700 sm:px-4"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
