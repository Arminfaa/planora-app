'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import type { CreateBoardInput } from '../types';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

type FormData = z.infer<typeof schema>;

export const CREATE_BOARD_FORM_ID = 'create-board-form';

interface CreateBoardFormProps {
  onSubmit: (data: CreateBoardInput) => Promise<void>;
  onCancel: () => void;
  variant?: 'default' | 'modal';
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

export function CreateBoardForm({
  onSubmit,
  onCancel,
  variant = 'default',
  onSubmittingChange,
}: CreateBoardFormProps) {
  const [error, setError] = useState('');
  const isModal = variant === 'modal';

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
    onSubmittingChange?.(true);
    try {
      await onSubmit(data);
      reset();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      onSubmittingChange?.(false);
    }
  };

  const formFields = (
    <>
      {isModal && (
        <p className="text-sm text-gray-500">
          To Do, In Progress, and Done columns are added automatically.
        </p>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Input
        label="Board Name"
        placeholder="e.g. Sprint Board"
        error={errors.name?.message}
        {...register('name')}
      />
    </>
  );

  if (isModal) {
    return (
      <form
        id={CREATE_BOARD_FORM_ID}
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
      <h3 className="mb-1 text-lg font-semibold text-gray-900">Create Board</h3>
      <p className="mb-4 text-sm text-gray-500">
        Default columns (To Do, In Progress, Done) will be added automatically.
      </p>

      <div className="space-y-4">
        {formFields}
        <div className="flex gap-3">
          <Button type="submit" isLoading={isSubmitting}>
            Create Board
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
