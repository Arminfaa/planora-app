'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { AppModal } from '@/shared/components/ui/AppModal';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  permissionMode: z.enum(['DEFAULT', 'CUSTOM']),
});

type FormData = z.infer<typeof schema>;

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
  const [error, setError] = useState('');
  const [originalRoles, setOriginalRoles] = useState<ProjectRoleDefinition[]>(
    [],
  );
  const [customRoles, setCustomRoles] = useState<CustomRoleInput[]>([
    { name: 'Admin', permissions: [] },
    { name: 'Member', permissions: [] },
  ]);
  const initialMode = project.permissionMode ?? 'DEFAULT';

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
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

  useEffect(() => {
    reset({
      name: project.name,
      description: project.description ?? '',
      permissionMode: project.permissionMode ?? 'DEFAULT',
    });
  }, [project, reset]);

  useEffect(() => {
    if (project.permissionMode !== 'CUSTOM') {
      setOriginalRoles([]);
      return;
    }

    const loadRoles = async () => {
      try {
        const roles = await projectService.listRoles(project.id);
        setOriginalRoles(roles);
        setCustomRoles(toCustomRoleInputs(roles));
      } catch {
        setOriginalRoles([]);
      }
    };

    void loadRoles();
  }, [project.id, project.permissionMode]);

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
          payload.customRoles = validateCustomRoles(customRoles);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Add at least one custom role with a name and one permission.',
          );
          return;
        }
      }
    }

    if (isEditingCustom && canManageRoles && rolesChanged) {
      try {
        validateCustomRoles(customRoles);
      } catch (err) {
        setError(getApiErrorMessage(err));
        return;
      }
    }

    try {
      await onSubmit(project.id, payload);

      if (isEditingCustom && canManageRoles && rolesChanged) {
        try {
          await syncCustomRoles(project.id, originalRoles, customRoles);
          const refreshed = await projectService.listRoles(project.id);
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
      title="Edit Project"
      onClose={onClose}
      width={672}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            form={FORM_ID}
            loading={isSubmitting}
          >
            Save
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

        <Input
          label="Project Name"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Description (optional)"
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Access model</p>
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
                      Default
                    </span>
                    <span className="block text-xs text-gray-500">
                      Owner, Admin, Member
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50/40">
                  <Radio value="CUSTOM" className="mt-1" />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">
                      Custom
                    </span>
                    <span className="block text-xs text-gray-500">
                      Define your own roles
                    </span>
                  </span>
                </label>
              </Radio.Group>
            )}
          />
        </div>

        {permissionMode === 'DEFAULT' && !isSwitchingToDefault && (
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600">
            <p className="font-medium text-gray-800">Default roles</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Owner — full access including edit/delete project</li>
              <li>Admin — full access except edit/delete project</li>
              <li>Member — board tasks, columns, background</li>
            </ul>
          </div>
        )}

        {isSwitchingToDefault && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Switching to default roles will remove all custom role definitions.
            Members will keep their Admin or Member access level.
          </div>
        )}

        {isEditingCustom && canManageRoles && (
          <CustomRolesBuilder roles={customRoles} onChange={setCustomRoles} />
        )}

        {isEditingCustom && !canManageRoles && originalRoles.length > 0 && (
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600">
            <p className="font-medium text-gray-800">Custom roles</p>
            <p className="mt-1">
              View role permissions in the Roles & Permissions section on the
              project page.
            </p>
          </div>
        )}

        {isSwitchingToCustom && (
          <CustomRolesBuilder roles={customRoles} onChange={setCustomRoles} />
        )}
      </form>
    </AppModal>
  );
}
