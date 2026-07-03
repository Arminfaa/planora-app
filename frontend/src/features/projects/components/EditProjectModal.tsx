'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Project, UpdateProjectInput } from '../types';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onSubmit: (projectId: string, input: UpdateProjectInput) => Promise<void>;
}

export function EditProjectModal({
  project,
  onClose,
  onSubmit,
}: EditProjectModalProps) {
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project.name,
      description: project.description ?? '',
    },
  });

  useEffect(() => {
    reset({
      name: project.name,
      description: project.description ?? '',
    });
  }, [project, reset]);

  const handleFormSubmit = async (data: FormData) => {
    setError('');
    try {
      await onSubmit(project.id, {
        name: data.name,
        description: data.description || undefined,
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Edit Project</h2>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="mt-4 space-y-4"
        >
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
