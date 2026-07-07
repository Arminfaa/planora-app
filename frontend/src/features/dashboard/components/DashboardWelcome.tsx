'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLocale } from '@/i18n/LocaleProvider';

export function DashboardWelcome() {
  const { user } = useAuth();
  const { t } = useLocale();
  const firstName = user?.name?.split(' ')[0] ?? t('common.there');

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900">
        {t('dashboard.welcomeName', { name: firstName })}
      </h1>
      <p className="mt-1 text-sm text-gray-600">{t('dashboard.subtitle')}</p>
    </div>
  );
}
