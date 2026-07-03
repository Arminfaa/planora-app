'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { COLUMN_COLOR_OPTIONS, type CreateColumnInput } from '../types';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color')
    .optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateColumnFormProps {
  onSubmit: (data: CreateColumnInput) => Promise<void>;
  onCancel: () => void;
  variant?: 'default' | 'glass';
}

export function CreateColumnForm({
  onSubmit,
  onCancel,
  variant = 'default',
}: CreateColumnFormProps) {
  const [error, setError] = useState('');
  const isGlass = variant === 'glass';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { color: COLUMN_COLOR_OPTIONS[0] },
  });

  const selectedColor = watch('color') ?? COLUMN_COLOR_OPTIONS[0];

  const handleFormSubmit = async (data: FormData) => {
    setError('');
    try {
      await onSubmit({
        name: data.name,
        color: data.color,
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={`flex w-72 shrink-0 flex-col rounded-xl border border-dashed p-4 ${
        isGlass
          ? 'border-white/30 bg-white/95 backdrop-blur-xl'
          : 'border-gray-300 bg-white'
      }`}
    >
      <h3 className="mb-3 text-sm font-semibold text-gray-900">New Column</h3>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <Input
          label="Name"
          placeholder="e.g. Review"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="space-y-1">
          <span className="block text-sm font-medium text-gray-700">Color</span>
          <div className="flex flex-wrap gap-2">
            {COLUMN_COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue('color', color)}
                className={`h-7 w-7 rounded-full border-2 transition ${
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

        <div className="flex gap-2 pt-1">
          <Button type="submit" isLoading={isSubmitting} className="flex-1">
            Add
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
