'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { useLocale } from '@/i18n/LocaleProvider';

function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const { t } = useLocale();

  if (!token) {
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

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
        {t('auth.resetPasswordTitle')}
      </h2>
      <ResetPasswordForm token={token} />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
