'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'antd';
import {
  COLUMN_COLOR_OPTIONS,
  type BoardColumn,
  type UpdateColumnInput,
} from '../types';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import { AppModal } from '@/shared/components/ui/AppModal';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color'),
});

type FormData = z.infer<typeof schema>;

const FORM_ID = 'edit-column-form';

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
    <AppModal
      title="Edit Column"
      onClose={onClose}
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
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        id={FORM_ID}
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4"
      >
        <Input
          label="Column Name"
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
      </form>
    </AppModal>
  );
}
