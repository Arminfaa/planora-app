'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'antd';
import {
  COLUMN_COLOR_OPTIONS,
  type BoardColumn,
  type UpdateColumnInput,
} from '../types';
import { useLocale } from '@/i18n/LocaleProvider';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import { AppModal } from '@/shared/components/ui/AppModal';

type FormData = {
  name: string;
  color: string;
};

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
  const { t } = useLocale();
  const [error, setError] = useState('');

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('validation.nameRequired')).max(50),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/, t('validation.invalidColor')),
      }),
    [t],
  );

  const {
    control,
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
  }, [column.id, reset]);

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
      title={t('board.editColumn')}
      onClose={onClose}
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
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              label={t('board.columnName')}
              error={errors.name?.message}
              {...field}
            />
          )}
        />

        <div className="space-y-1">
          <span className="block text-sm font-medium text-gray-700">
            {t('labels.color')}
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
                aria-label={`${t('labels.color')} ${color}`}
              />
            ))}
          </div>
        </div>
      </form>
    </AppModal>
  );
}
