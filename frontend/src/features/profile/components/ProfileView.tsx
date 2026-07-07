'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { App, Button } from 'antd';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/auth.service';
import {
  createChangePasswordSchema,
  type ChangePasswordFormData,
} from '@/features/auth/types';
import { getApiErrorMessage } from '@/lib/api';
import { getAssetUrl } from '@/lib/assets';
import { AssetImage } from '@/shared/components/ui/AssetImage';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Input } from '@/shared/components/ui/Input';
import { useLocale } from '@/i18n/LocaleProvider';
import { getIntlLocale, type Locale } from '@/i18n/types';

function formatMemberSince(value: string, locale: Locale) {
  return new Date(value).toLocaleString(getIntlLocale(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function ProfileView() {
  const { message } = App.useApp();
  const { user, updateUser } = useAuth();
  const { t, locale } = useLocale();
  const changePasswordSchema = useMemo(
    () => createChangePasswordSchema(t),
    [t],
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  if (!user) return null;

  const avatarUrl = user.avatar ? getAssetUrl(user.avatar) : null;
  const nameChanged = name.trim() !== user.name;

  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === user.name) return;

    setIsSavingName(true);
    setProfileError('');
    try {
      const updated = await authService.updateProfile(trimmed);
      updateUser(updated);
      setName(updated.name);
      message.success(t('profile.nameUpdated'));
    } catch (err) {
      setProfileError(getApiErrorMessage(err));
    } finally {
      setIsSavingName(false);
    }
  };

  const handleAvatarSelect = async (file: File) => {
    setIsUploadingAvatar(true);
    setProfileError('');
    try {
      const updated = await authService.uploadAvatar(file);
      updateUser(updated);
      message.success(t('profile.avatarUpdated'));
    } catch (err) {
      setProfileError(getApiErrorMessage(err));
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setIsRemovingAvatar(true);
    setProfileError('');
    try {
      const updated = await authService.removeAvatar();
      updateUser(updated);
      message.success(t('profile.avatarRemoved'));
    } catch (err) {
      setProfileError(getApiErrorMessage(err));
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await authService.changePassword(
        data.currentPassword,
        data.newPassword,
        data.confirmPassword,
      );
      reset();
      setPasswordSuccess(t('profile.passwordUpdated'));
      message.success(t('auth.passwordChanged'));
    } catch (err) {
      setPasswordError(getApiErrorMessage(err));
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('profile.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {t('profile.manageAccount')}
          </p>
        </div>

        {profileError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {profileError}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <AssetImage
                    src={avatarUrl}
                    alt={user.name}
                    width={80}
                    height={80}
                    resolveAsset={false}
                    className="h-20 w-20 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-violet-600 text-xl font-semibold text-white shadow-sm">
                    {getInitials(user.name)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleAvatarSelect(file);
                  }}
                />
                <Button
                  loading={isUploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('profile.uploadAvatar')}
                </Button>
                {avatarUrl && (
                  <Button
                    danger
                    loading={isRemovingAvatar}
                    onClick={() => void handleRemoveAvatar()}
                  >
                    {t('profile.removeAvatar')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  label={t('profile.fullName')}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <Button
                type="primary"
                loading={isSavingName}
                disabled={!nameChanged || name.trim().length < 2}
                onClick={() => void handleSaveName()}
              >
                {t('profile.saveName')}
              </Button>
            </div>

            <Input
              label={t('auth.emailLabel')}
              value={user.email}
              readOnly
              disabled
            />

            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-sm font-medium text-gray-500">
                {t('profile.memberSince')}
              </p>
              <p className="mt-1 text-sm text-gray-900">
                {formatMemberSince(user.createdAt, locale)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('profile.changePassword')}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t('profile.passwordHint')}
          </p>

          <form
            onSubmit={handleSubmit(onPasswordSubmit)}
            className="mt-5 space-y-4"
          >
            {passwordError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {passwordSuccess}
              </div>
            )}

            <Input
              label={t('profile.currentPassword')}
              type="password"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />

            <Input
              label={t('profile.newPassword')}
              type="password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />

            <Input
              label={t('profile.confirmPassword')}
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              {t('profile.updatePassword')}
            </Button>
          </form>
        </section>
      </div>
    </PageContainer>
  );
}
