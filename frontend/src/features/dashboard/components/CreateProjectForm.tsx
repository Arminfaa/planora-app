'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo, useState } from 'react';
import { Radio } from 'antd';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import type {
  CreateProjectInput,
  PermissionMode,
} from '@/features/projects/types';
import { validateCustomRoles } from '@/features/projects/utils/syncCustomRoles';
import { CustomRolesBuilder } from './CustomRolesBuilder';
import { useLocale } from '@/i18n/LocaleProvider';

type FormData = {
  name: string;
  description?: string;
  permissionMode: 'DEFAULT' | 'CUSTOM';
};

export const CREATE_PROJECT_FORM_ID = 'create-project-form';

interface CreateProjectFormProps {
  onSubmit: (data: CreateProjectInput) => Promise<void>;
  onCancel: () => void;
  variant?: 'default' | 'modal';
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

export function CreateProjectForm({
  onSubmit,
  onCancel,
  variant = 'default',
  onSubmittingChange,
}: CreateProjectFormProps) {
  const { t } = useLocale();
  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, t('auth.errors.nameMinLength')),
        description: z.string().max(500).optional(),
        permissionMode: z.enum(['DEFAULT', 'CUSTOM']),
      }),
    [t],
  );
  const [error, setError] = useState('');
  const [customRoles, setCustomRoles] = useState<
    { name: string; permissions: string[] }[]
  >([
    { name: t('dashboard.createProjectForm.projectManager'), permissions: [] },
  ]);
  const isModal = variant === 'modal';

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { permissionMode: 'DEFAULT' },
  });

  const permissionMode = watch('permissionMode') as PermissionMode;

  const handleFormSubmit = async (data: FormData) => {
    setError('');
    onSubmittingChange?.(true);

    try {
      if (permissionMode === 'CUSTOM') {
        const validRoles = validateCustomRoles(customRoles);
        await onSubmit({
          name: data.name,
          description: data.description,
          permissionMode: 'CUSTOM',
          customRoles: validRoles,
        });
        reset();
        setCustomRoles([
          {
            name: t('dashboard.createProjectForm.projectManager'),
            permissions: [],
          },
        ]);
        return;
      }

      await onSubmit({
        name: data.name,
        description: data.description,
        permissionMode: 'DEFAULT',
      });
      reset();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      onSubmittingChange?.(false);
    }
  };

  const formFields = (
    <>
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Input
        label={t('dashboard.createProjectForm.nameLabel')}
        error={errors.name?.message}
        {...register('name')}
      />
      <Input
        label={t('dashboard.createProjectForm.descriptionOptional')}
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">
          {t('dashboard.createProjectForm.accessModel')}
        </p>
        <Controller
          name="permissionMode"
          control={control}
          render={({ field }) => (
            <Radio.Group
              {...field}
              className="grid w-full gap-2 sm:grid-cols-2"
            >
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50/40">
                <Radio value="DEFAULT" className="mt-1" />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    {t('dashboard.createProjectForm.defaultOption')}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {t('dashboard.createProjectForm.defaultOptionHint')}
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50/40">
                <Radio value="CUSTOM" className="mt-1" />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    {t('dashboard.createProjectForm.customOption')}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {t('dashboard.createProjectForm.customOptionHint')}
                  </span>
                </span>
              </label>
            </Radio.Group>
          )}
        />
      </div>

      {permissionMode === 'DEFAULT' && (
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600">
          <p className="font-medium text-gray-800">
            {t('dashboard.createProjectForm.defaultRolesTitle')}
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>{t('permissions.defaultRoleOwner')}</li>
            <li>{t('permissions.defaultRoleAdmin')}</li>
            <li>{t('permissions.defaultRoleMember')}</li>
          </ul>
        </div>
      )}

      {permissionMode === 'CUSTOM' && (
        <CustomRolesBuilder roles={customRoles} onChange={setCustomRoles} />
      )}
    </>
  );

  const formActions = (
    <div className="flex justify-end gap-3">
      <Button type="button" variant="secondary" onClick={onCancel}>
        {t('common.cancel')}
      </Button>
      <Button type="submit" isLoading={isSubmitting}>
        {t('dashboard.createProjectForm.submit')}
      </Button>
    </div>
  );

  if (isModal) {
    return (
      <form
        id={CREATE_PROJECT_FORM_ID}
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4"
      >
        {formFields}
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {t('dashboard.createProjectForm.title')}
      </h2>

      <div className="space-y-4">
        {formFields}
        {formActions}
      </div>
    </form>
  );
}
