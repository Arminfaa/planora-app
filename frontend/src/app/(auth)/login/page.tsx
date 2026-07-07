'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { useLocale } from '@/i18n/LocaleProvider';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const redirectTo = searchParams.get('redirect');
  const { t } = useLocale();

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
        {t('auth.welcomeBack')}
      </h2>
      {redirectTo && (
        <div className="mb-4 rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary-900">
          {t('auth.redirectNotification')}
        </div>
      )}
      <LoginForm inviteToken={inviteToken} redirectTo={redirectTo} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginPageContent />
    </Suspense>
  );
}
