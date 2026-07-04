'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { registerSchema, type RegisterFormData } from '../types';
import { useInvitePreview } from '@/features/projects/hooks/useProjectTeam';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';

interface RegisterFormProps {
  inviteToken?: string | null;
}

export function RegisterForm({ inviteToken = null }: RegisterFormProps) {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState('');
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {inviteToken && loadingInvite && (
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Loading invite...
        </div>
      )}

      {inviteToken && preview?.valid && (
        <div className="rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary-900">
          You are joining <strong>{preview.projectName}</strong> as{' '}
          <strong>
            {(preview.roleName ?? preview.role ?? 'member').toLowerCase()}
          </strong>
          .
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
        label="Name"
        type="text"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        readOnly={Boolean(preview?.valid)}
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Button
        type="submit"
        className="w-full"
        isLoading={isSubmitting}
        disabled={Boolean(inviteToken && !preview?.valid)}
      >
        Create Account
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          href={inviteToken ? `/accept-invite?token=${inviteToken}` : '/login'}
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Sign In
        </Link>
      </p>
    </form>
  );
}
