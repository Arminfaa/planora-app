'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { useLocale } from '@/i18n/LocaleProvider';

function ResetPasswordQueryRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token')?.trim() ?? '';
  const { t } = useLocale();

  useEffect(() => {
    if (token) {
      router.replace(`/reset-password/${encodeURIComponent(token)}`);
    }
  }, [router, token]);

  if (token) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-5">
      <h2 className="text-center text-2xl font-bold text-gray-900">
        {t('auth.resetPasswordTitle')}
      </h2>
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {t('auth.resetPasswordMissingToken')}
      </div>
      <p className="text-center text-sm text-gray-500">
        <Link
          href="/forgot-password"
          className="font-medium text-gray-900 underline underline-offset-2 hover:text-primary-600"
        >
          {t('auth.forgotPassword')}
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordQueryRedirect />
    </Suspense>
  );
}
