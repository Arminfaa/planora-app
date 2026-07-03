'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Project Management';

export function LandingNavbar() {
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-gray-900">
          {appName}
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {!isLoading && isAuthenticated ? (
            <>
              {user?.name && (
                <span className="hidden text-sm text-gray-500 sm:inline">
                  Hi, {user.name.split(' ')[0]}
                </span>
              )}
              <Link
                href="/dashboard"
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
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
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
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
