'use client';

import Link from 'next/link';
import { AuthShowcase } from './AuthShowcase';
import { AppLogo } from '@/shared/components/ui/AppLogo';
import { useLocale } from '@/i18n/LocaleProvider';

interface AuthPageLayoutProps {
  children: React.ReactNode;
}

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  const { t } = useLocale();

  return (
    <div className="auth-page-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />
      <div className="auth-bg-orb auth-bg-orb-3" />
      <div className="auth-bg-grid pointer-events-none absolute inset-0" />

      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-gray-900/10 ring-1 ring-gray-200/60">
        <div className="grid lg:min-h-[560px] lg:grid-cols-2">
          <div className="hidden lg:block">
            <AuthShowcase />
          </div>

          <div className="flex flex-col justify-center px-8 py-10 sm:px-12 lg:py-12">
            <div className="mb-8 flex items-center justify-center gap-2.5">
              <AppLogo
                size="md"
                className="rounded-lg shadow-md shadow-primary-600/30"
              />
              <Link
                href="/"
                className="text-xl font-bold tracking-tight text-gray-900 transition hover:text-primary-600"
              >
                {t('auth.appBrand')}
              </Link>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
