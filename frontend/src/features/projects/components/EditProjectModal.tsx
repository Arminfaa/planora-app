'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Radio } from 'antd';
import type {
  CustomRoleInput,
  PermissionMode,
  Project,
  ProjectRoleDefinition,
  UpdateProjectInput,
} from '../types';
import { projectService } from '../services/project.service';
import {
  hasCustomRoleChanges,
  syncCustomRoles,
  toCustomRoleInputs,
  validateCustomRoles,
} from '../utils/syncCustomRoles';
import { CustomRolesBuilder } from '@/features/dashboard/components/CustomRolesBuilder';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import { queryKeys, STALE_TIME } from '@/lib/query-keys';
import { AppModal } from '@/shared/components/ui/AppModal';
import { useLocale } from '@/i18n/LocaleProvider';

type FormData = {
  name: string;
  description?: string;
  permissionMode: 'DEFAULT' | 'CUSTOM';
};

const FORM_ID = 'edit-project-form';

interface EditProjectModalProps {
  project: Project;
  canManageRoles?: boolean;
  onClose: () => void;
  onSubmit: (projectId: string, input: UpdateProjectInput) => Promise<void>;
  onRolesUpdated?: (roles: ProjectRoleDefinition[]) => void;
}

export function EditProjectModal({
  project,
  canManageRoles = false,
  onClose,
  onSubmit,
  onRolesUpdated,
}: EditProjectModalProps) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [originalRoles, setOriginalRoles] = useState<ProjectRoleDefinition[]>(
    [],
  );
  const [customRoles, setCustomRoles] = useState<CustomRoleInput[]>([
    { name: 'Admin', permissions: [] },
    { name: 'Member', permissions: [] },
  ]);
  const initialMode = project.permissionMode ?? 'DEFAULT';

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, t('auth.errors.nameMinLength')).max(100),
        description: z.string().max(500).optional(),
        permissionMode: z.enum(['DEFAULT', 'CUSTOM']),
      }),
    [t],
  );

  const roleValidationMessages = useMemo(
    () => ({
      empty: t('permissions.builder.addOneRole'),
      incomplete: t('permissions.builder.roleIncomplete'),
    }),
    [t],
  );

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project.name,
      description: project.description ?? '',
      permissionMode: initialMode,
    },
  });

  const permissionMode = watch('permissionMode') as PermissionMode;
  const isSwitchingToCustom =
    initialMode === 'DEFAULT' && permissionMode === 'CUSTOM';
  const isSwitchingToDefault =
    initialMode === 'CUSTOM' && permissionMode === 'DEFAULT';
  const isEditingCustom =
    initialMode === 'CUSTOM' && permissionMode === 'CUSTOM';
  const rolesChanged = hasCustomRoleChanges(originalRoles, customRoles);

  const rolesQuery = useQuery({
    queryKey: queryKeys.projects.roles(project.id),
    queryFn: () => projectService.listRoles(project.id),
    enabled: project.permissionMode === 'CUSTOM',
    staleTime: STALE_TIME.roles,
  });

  useEffect(() => {
    if (project.permissionMode !== 'CUSTOM' || !rolesQuery.data) {
      setOriginalRoles([]);
      return;
    }

    setOriginalRoles(rolesQuery.data);
    setCustomRoles(toCustomRoleInputs(rolesQuery.data));
  }, [project.id, project.permissionMode, rolesQuery.data]);

  const handleFormSubmit = async (data: FormData) => {
    setError('');

    const payload: UpdateProjectInput = {
      name: data.name,
      description: data.description || undefined,
    };

    if (data.permissionMode !== initialMode) {
      payload.permissionMode = data.permissionMode;

      if (data.permissionMode === 'CUSTOM') {
        try {
          payload.customRoles = validateCustomRoles(
            customRoles,
            roleValidationMessages,
          );
        } catch (err) {
          setError(
            err instanceof Error ? err.message : roleValidationMessages.empty,
          );
          return;
        }
      }
    }

    if (isEditingCustom && canManageRoles && rolesChanged) {
      try {
        validateCustomRoles(customRoles, roleValidationMessages);
      } catch (err) {
        setError(getApiErrorMessage(err));
        return;
      }
    }

    try {
      await onSubmit(project.id, payload);

      if (isEditingCustom && canManageRoles && rolesChanged) {
        try {
          await syncCustomRoles(
            project.id,
            originalRoles,
            customRoles,
            roleValidationMessages,
          );
          const refreshed = await queryClient.fetchQuery({
            queryKey: queryKeys.projects.roles(project.id),
            queryFn: () => projectService.listRoles(project.id),
          });
          onRolesUpdated?.(refreshed);
        } catch (err) {
          setError(getApiErrorMessage(err));
          return;
        }
      }

      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <AppModal
      title={t('projects.editProject')}
      onClose={onClose}
      width={672}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="primary"
            htmlType="submit"
            form={FORM_ID}
            loading={isSubmitting}
          >
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4"
      >
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              label={t('dashboard.createProjectForm.nameLabel')}
              error={errors.name?.message}
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Input
              label={t('dashboard.createProjectForm.descriptionOptional')}
              error={errors.description?.message}
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          )}
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
                value={field.value}
                onChange={field.onChange}
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

        {permissionMode === 'DEFAULT' && !isSwitchingToDefault && (
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

        {isSwitchingToDefault && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t('projects.switchToDefaultWarning')}
          </div>
        )}

        {isEditingCustom && canManageRoles && (
          <CustomRolesBuilder roles={customRoles} onChange={setCustomRoles} />
        )}

        {isEditingCustom && !canManageRoles && originalRoles.length > 0 && (
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600">
            <p className="font-medium text-gray-800">
              {t('permissions.customRoles')}
            </p>
            <p className="mt-1">{t('projects.customRolesReadOnlyHint')}</p>
          </div>
        )}

        {isSwitchingToCustom && (
          <CustomRolesBuilder roles={customRoles} onChange={setCustomRoles} />
        )}
      </form>
    </AppModal>
  );
}
