'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  COLUMN_COLOR_OPTIONS,
  type BoardColumn,
  type UpdateColumnInput,
} from '../types';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color'),
});

type FormData = z.infer<typeof schema>;

interface EditColumnModalProps {
  column: BoardColumn;
  onClose: () => void;
  onSubmit: (columnId: string, input: UpdateColumnInput) => Promise<void>;
}

export function EditColumnModal({
  column,
  onClose,
  onSubmit,
}: EditColumnModalProps) {
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: column.name,
      color: column.color ?? COLUMN_COLOR_OPTIONS[0],
    },
  });

  const selectedColor = watch('color');

  useEffect(() => {
    reset({
      name: column.name,
      color: column.color ?? COLUMN_COLOR_OPTIONS[0],
    });
  }, [column, reset]);

  const handleFormSubmit = async (data: FormData) => {
    setError('');
    try {
      await onSubmit(column.id, {
        name: data.name,
        color: data.color,
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
        <h2 className="text-lg font-semibold text-gray-900">Edit Column</h2>

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
            label="Column Name"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="space-y-1">
            <span className="block text-sm font-medium text-gray-700">
              Color
            </span>
            <div className="flex flex-wrap gap-2">
              {COLUMN_COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    selectedColor === color
                      ? 'border-gray-900 scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>

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
