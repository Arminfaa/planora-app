'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserMenuDropdown } from '@/shared/components/layout/UserMenuDropdown';

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Project Management';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
];

export function LandingNavbar() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/30 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-violet-600 text-sm font-bold text-white shadow-sm shadow-primary-500/25 transition group-hover:shadow-md group-hover:shadow-primary-500/30">
            P
          </span>
          <span className="text-lg font-semibold text-gray-900">{appName}</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100/80 hover:text-gray-900 sm:inline-flex"
            >
              {link.label}
            </Link>
          ))}

          {!isLoading && isAuthenticated ? (
            <>
              <UserMenuDropdown />
              <Link
                href="/dashboard"
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-primary-600/20 transition hover:bg-primary-700"
              >
                Dashboard
              </Link>
            </>
          ) : !isLoading ? (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-primary-600/20 transition hover:bg-primary-700"
              >
                Get Started
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
