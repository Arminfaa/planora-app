'use client';

import { useSearchParams } from 'next/navigation';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { useLocale } from '@/i18n/LocaleProvider';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const { t } = useLocale();

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
        {t('auth.registerTitle')}
      </h2>
      <RegisterForm inviteToken={inviteToken} />
    </div>
  );
}
