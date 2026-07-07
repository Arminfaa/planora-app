'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { createLoginSchema, type LoginFormData } from '../types';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import { useLocale } from '@/i18n/LocaleProvider';

interface LoginFormProps {
  inviteToken?: string | null;
  redirectTo?: string | null;
}

export function LoginForm({
  inviteToken = null,
  redirectTo = null,
}: LoginFormProps) {
  const { login } = useAuth();
  const { t } = useLocale();
  const [error, setError] = useState('');
  const loginSchema = useMemo(() => createLoginSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    try {
      await login(
        data,
        inviteToken ? { inviteToken } : redirectTo ? { redirectTo } : undefined,
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {inviteToken && (
        <div className="rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary-900">
          {t('auth.inviteSignInPrompt')}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Input
        label={t('auth.emailLabel')}
        type="email"
        autoComplete="email"
        size="large"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label={t('auth.passwordLabel')}
        type="password"
        autoComplete="current-password"
        size="large"
        error={errors.password?.message}
        {...register('password')}
      />

      <Button
        type="submit"
        className="w-full !rounded-lg !bg-gray-900 !py-3 text-base font-semibold hover:!bg-gray-800 focus:ring-gray-700"
        isLoading={isSubmitting}
      >
        {t('auth.login')}
      </Button>

      <p className="text-center text-sm text-gray-500">
        {t('auth.noAccount')}{' '}
        <Link
          href={inviteToken ? `/register?invite=${inviteToken}` : '/register'}
          className="font-medium text-gray-900 underline underline-offset-2 hover:text-primary-600"
        >
          {t('auth.register')}
        </Link>
      </p>
    </form>
  );
}
