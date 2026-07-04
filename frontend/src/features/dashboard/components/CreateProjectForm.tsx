'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import type {
  CreateProjectInput,
  PermissionMode,
} from '@/features/projects/types';
import { validateCustomRoles } from '@/features/projects/utils/syncCustomRoles';
import { CustomRolesBuilder } from './CustomRolesBuilder';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().max(500).optional(),
    permissionMode: z.enum(['DEFAULT', 'CUSTOM']),
  })
  .superRefine((data, ctx) => {
    // custom roles validated separately in submit handler
    if (data.permissionMode === 'CUSTOM' && data.name.length < 2) {
      return;
    }
  });

type FormData = z.infer<typeof schema>;

const FORM_ID = 'create-project-form';

interface CreateProjectFormProps {
  onSubmit: (data: CreateProjectInput) => Promise<void>;
  onCancel: () => void;
  variant?: 'default' | 'modal';
}

export function CreateProjectForm({
  onSubmit,
  onCancel,
  variant = 'default',
}: CreateProjectFormProps) {
  const [error, setError] = useState('');
  const [customRoles, setCustomRoles] = useState<
    { name: string; permissions: string[] }[]
  >([{ name: 'Project Manager', permissions: [] }]);
  const isModal = variant === 'modal';

  const {
    register,
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

    if (permissionMode === 'CUSTOM') {
      try {
        const validRoles = validateCustomRoles(customRoles);
        await onSubmit({
          name: data.name,
          description: data.description,
          permissionMode: 'CUSTOM',
          customRoles: validRoles,
        });
        reset();
        setCustomRoles([{ name: 'Project Manager', permissions: [] }]);
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
      return;
    }

    try {
      await onSubmit({
        name: data.name,
        description: data.description,
        permissionMode: 'DEFAULT',
      });
      reset();
    } catch (err) {
      setError(getApiErrorMessage(err));
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

      {permissionMode === 'DEFAULT' && (
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600">
          <p className="font-medium text-gray-800">Default roles</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Owner — full access including edit/delete project</li>
            <li>Admin — full access except edit/delete project</li>
            <li>Member — board tasks, columns, background</li>
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
        Cancel
      </Button>
      <Button type="submit" isLoading={isSubmitting}>
        Create Project
      </Button>
    </div>
  );

  if (isModal) {
    return (
      <>
        <form
          id={FORM_ID}
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {formFields}
          </div>
        </form>

        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={isSubmitting}>
            Create Project
          </Button>
        </div>
      </>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Create Project
      </h2>

      <div className="space-y-4">
        {formFields}
        {formActions}
      </div>
    </form>
  );
}
