'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  createForgotPasswordSchema,
  type ForgotPasswordFormData,
} from '../types';
import { authService } from '../services/auth.service';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import { useLocale } from '@/i18n/LocaleProvider';

export function ForgotPasswordForm() {
  const { t } = useLocale();
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const schema = useMemo(() => createForgotPasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError('');
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  if (sent) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {t('auth.forgotPasswordSent')}
        </div>
        <p className="text-center text-sm text-gray-500">
          <Link
            href="/login"
            className="font-medium text-gray-900 underline underline-offset-2 hover:text-primary-600"
          >
            {t('auth.backToLogin')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <p className="text-sm text-gray-600">{t('auth.forgotPasswordHint')}</p>

      <Input
        label={t('auth.emailLabel')}
        type="email"
        autoComplete="email"
        size="large"
        error={errors.email?.message}
        {...register('email')}
      />

      <Button
        type="submit"
        className="w-full !rounded-lg !bg-gray-900 !py-3 text-base font-semibold hover:!bg-gray-800 focus:ring-gray-700"
        isLoading={isSubmitting}
      >
        {t('auth.sendResetLink')}
      </Button>

      <p className="text-center text-sm text-gray-500">
        <Link
          href="/login"
          className="font-medium text-gray-900 underline underline-offset-2 hover:text-primary-600"
        >
          {t('auth.backToLogin')}
        </Link>
      </p>
    </form>
  );
}
