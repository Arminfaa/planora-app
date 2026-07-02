'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { registerSchema, type RegisterFormData } from '../types';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    try {
      await registerUser(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Create Account
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Sign In
        </Link>
      </p>
    </form>
  );
}
