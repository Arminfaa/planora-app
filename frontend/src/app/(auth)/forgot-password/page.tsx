'use client';

import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';
import { useLocale } from '@/i18n/LocaleProvider';

export default function ForgotPasswordPage() {
  const { t } = useLocale();

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
        {t('auth.forgotPasswordTitle')}
      </h2>
      <ForgotPasswordForm />
    </div>
  );
}
