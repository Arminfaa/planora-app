'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { createRegisterSchema, type RegisterFormData } from '../types';
import { useInvitePreview } from '@/features/projects/hooks/useProjectTeam';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import { useLocale } from '@/i18n/LocaleProvider';

interface RegisterFormProps {
  inviteToken?: string | null;
}

export function RegisterForm({ inviteToken = null }: RegisterFormProps) {
  const { register: registerUser } = useAuth();
  const { t } = useLocale();
  const [error, setError] = useState('');
  const registerSchema = useMemo(() => createRegisterSchema(t), [t]);
  const {
    preview,
    isLoading: loadingInvite,
    error: inviteError,
  } = useInvitePreview(inviteToken);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (preview?.valid && preview.email) {
      setValue('email', preview.email);
    }
  }, [preview, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    try {
      await registerUser(data, inviteToken ?? undefined);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const roleName = (
    preview?.roleName ??
    preview?.role ??
    'member'
  ).toLowerCase();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {inviteToken && loadingInvite && (
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
          {t('auth.loadingInvite')}
        </div>
      )}

      {inviteToken && preview?.valid && (
        <div className="rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary-900">
          {t('auth.inviteRegisterPrompt', {
            projectName: preview.projectName ?? '',
            role: roleName,
          })}
        </div>
      )}

      {inviteToken && inviteError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {inviteError}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Input
        label={t('auth.nameLabel')}
        type="text"
        autoComplete="name"
        size="large"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label={t('auth.emailLabel')}
        type="email"
        autoComplete="email"
        size="large"
        readOnly={Boolean(preview?.valid)}
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label={t('auth.passwordLabel')}
        type="password"
        autoComplete="new-password"
        size="large"
        error={errors.password?.message}
        {...register('password')}
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
        className="mt-2 w-full !rounded-lg !bg-gray-900 !py-3 text-base font-semibold hover:!bg-gray-800 focus:ring-gray-700"
        isLoading={isSubmitting}
        disabled={Boolean(inviteToken && !preview?.valid)}
      >
        {t('auth.createAccount')}
      </Button>

      <p className="text-center text-sm text-gray-500">
        {t('auth.hasAccount')}{' '}
        <Link
          href={inviteToken ? `/accept-invite?token=${inviteToken}` : '/login'}
          className="font-medium text-gray-900 underline underline-offset-2 hover:text-primary-600"
        >
          {t('auth.login')}
        </Link>
      </p>
    </form>
  );
}
