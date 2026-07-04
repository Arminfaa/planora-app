'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
  CustomRoleInput,
  PermissionMode,
  Project,
  ProjectRoleDefinition,
  UpdateProjectInput,
} from '../types';
import { projectService } from '../services/project.service';
import {
  syncCustomRoles,
  toCustomRoleInputs,
  validateCustomRoles,
} from '../utils/syncCustomRoles';
import { CustomRolesBuilder } from '@/features/dashboard/components/CustomRolesBuilder';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';

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

    try {
      await onSubmit(project.id, payload);

      if (isEditingCustom && canManageRoles) {
        try {
          validateCustomRoles(customRoles);
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-project-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2
            id="edit-project-title"
            className="text-lg font-semibold text-gray-900"
          >
            Edit Project
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          id={FORM_ID}
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
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
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50/40">
                  <input
                    type="radio"
                    value="DEFAULT"
                    {...register('permissionMode')}
                    className="mt-1"
                  />
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
                  <input
                    type="radio"
                    value="CUSTOM"
                    {...register('permissionMode')}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">
                      Custom
                    </span>
                    <span className="block text-xs text-gray-500">
                      Define your own roles
                    </span>
                  </span>
                </label>
              </div>
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
                Switching to default roles will remove all custom role
                definitions. Members will keep their Admin or Member access
                level.
              </div>
            )}

            {isEditingCustom && canManageRoles && (
              <CustomRolesBuilder
                roles={customRoles}
                onChange={setCustomRoles}
              />
            )}

            {isEditingCustom && !canManageRoles && originalRoles.length > 0 && (
              <div className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600">
                <p className="font-medium text-gray-800">Custom roles</p>
                <p className="mt-1">
                  View role permissions in the Roles & Permissions section on
                  the project page.
                </p>
              </div>
            )}

            {isSwitchingToCustom && (
              <CustomRolesBuilder
                roles={customRoles}
                onChange={setCustomRoles}
              />
            )}
          </div>
        </form>

        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={isSubmitting}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
