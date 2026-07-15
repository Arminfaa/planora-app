import { z } from 'zod';
import type { Translator } from '@/i18n/utils';

export function createLoginSchema(t: Translator) {
  return z.object({
    email: z.string().email(t('auth.errors.invalidEmail')),
    password: z.string().min(1, t('auth.errors.passwordRequired')),
  });
}

export function createRegisterSchema(t: Translator) {
  return z
    .object({
      name: z.string().min(2, t('auth.errors.nameMinLength')),
      email: z.string().email(t('auth.errors.invalidEmail')),
      password: z.string().min(8, t('auth.errors.passwordMinLength')),
      confirmPassword: z
        .string()
        .min(1, t('auth.errors.confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.errors.passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });
}

export function createChangePasswordSchema(t: Translator) {
  return z
    .object({
      currentPassword: z
        .string()
        .min(1, t('auth.errors.currentPasswordRequired')),
      newPassword: z.string().min(8, t('auth.errors.passwordMinLength')),
      confirmPassword: z
        .string()
        .min(1, t('auth.errors.confirmPasswordRequired')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('auth.errors.passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });
}

export function createForgotPasswordSchema(t: Translator) {
  return z.object({
    email: z.string().email(t('auth.errors.invalidEmail')),
  });
}

export function createResetPasswordSchema(t: Translator) {
  return z
    .object({
      newPassword: z.string().min(8, t('auth.errors.passwordMinLength')),
      confirmPassword: z
        .string()
        .min(1, t('auth.errors.confirmPasswordRequired')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('auth.errors.passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });
}

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;
export type ChangePasswordFormData = z.infer<
  ReturnType<typeof createChangePasswordSchema>
>;
export type ForgotPasswordFormData = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>;
export type ResetPasswordFormData = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>;

/** @deprecated Use createLoginSchema(t) */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/** @deprecated Use createRegisterSchema(t) */
export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/** @deprecated Use createChangePasswordSchema(t) */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
