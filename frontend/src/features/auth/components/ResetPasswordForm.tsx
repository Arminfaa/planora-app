'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  createResetPasswordSchema,
  type ResetPasswordFormData,
} from '../types';
import { authService } from '../services/auth.service';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { getApiErrorMessage } from '@/lib/api';
import { useLocale } from '@/i18n/LocaleProvider';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [error, setError] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [doneEmail, setDoneEmail] = useState<string | null>(null);
  const schema = useMemo(() => createResetPasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    let cancelled = false;

    const loadPreview = async () => {
      setLoadingPreview(true);
      setPreviewError('');
      try {
        const result = await authService.previewResetPassword(token);
        if (!cancelled) {
          setEmail(result.email);
        }
      } catch (err) {
        if (!cancelled) {
          setPreviewError(getApiErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoadingPreview(false);
        }
      }
    };

    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!doneEmail) return;
    const timer = window.setTimeout(() => {
      router.replace('/login');
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [doneEmail, router]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError('');
    try {
      const result = await authService.resetPassword(
        token,
        data.newPassword,
        data.confirmPassword,
      );
      setDoneEmail(result.email);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  if (loadingPreview) {
    return (
      <div className="flex min-h-[180px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (previewError || !email) {
    return (
      <div className="space-y-5">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          {t('auth.resetPasswordTitle')}
        </h2>
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {previewError || t('auth.resetPasswordMissingToken')}
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

  if (doneEmail) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {t('auth.resetPasswordSuccessForEmail', { email: doneEmail })}
        </div>
        <p className="text-center text-sm text-gray-500">
          {t('auth.resetPasswordRedirecting')}{' '}
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
    <div>
      <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
        {t('auth.resetPasswordTitle')}
      </h2>
      <p className="mb-6 text-center text-sm text-gray-600">
        {t('auth.resetPasswordForEmail', { email })}
      </p>

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
    </div>
  );
}
