'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  createResetPasswordSchema,
  type ResetPasswordFormData,
} from '../types';
import { authService } from '../services/auth.service';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import { useLocale } from '@/i18n/LocaleProvider';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { t } = useLocale();
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const schema = useMemo(() => createResetPasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError('');
    try {
      await authService.resetPassword(
        token,
        data.newPassword,
        data.confirmPassword,
      );
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  if (done) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {t('auth.resetPasswordSuccess')}
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

      <Input
        label={t('auth.newPasswordLabel')}
        type="password"
        autoComplete="new-password"
        size="large"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />

      <Input
        label={t('auth.confirmPasswordLabel')}
        type="password"
        autoComplete="new-password"
        size="large"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Button
        type="submit"
        className="w-full !rounded-lg !bg-gray-900 !py-3 text-base font-semibold hover:!bg-gray-800 focus:ring-gray-700"
        isLoading={isSubmitting}
      >
        {t('auth.resetPasswordSubmit')}
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
