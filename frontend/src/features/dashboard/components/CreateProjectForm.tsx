'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import type { CreateProjectInput } from '@/features/projects/types';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateProjectFormProps {
  onSubmit: (data: CreateProjectInput) => Promise<void>;
  onCancel: () => void;
}

export function CreateProjectForm({
  onSubmit,
  onCancel,
}: CreateProjectFormProps) {
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleFormSubmit = async (data: FormData) => {
    setError('');
    try {
      await onSubmit(data);
      reset();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Create Project
      </h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
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
        <div className="flex gap-3">
          <Button type="submit" isLoading={isSubmitting}>
            Create Project
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
