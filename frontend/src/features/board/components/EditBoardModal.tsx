'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Switch } from 'antd';
import {
  BOARD_COLOR_OPTIONS,
  BOARD_COMPLETED_COLOR,
  type Board,
  type UpdateBoardInput,
} from '../types';
import { getBoardAccentColor } from '../utils/boardAccentColor';
import { useLocale } from '@/i18n/LocaleProvider';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import { AppModal } from '@/shared/components/ui/AppModal';

type FormData = {
  name: string;
  color: string;
  isCompleted: boolean;
};

const FORM_ID = 'edit-board-form';

interface EditBoardModalProps {
  board: Board;
  onClose: () => void;
  onSubmit: (boardId: string, input: UpdateBoardInput) => Promise<void>;
}

export function EditBoardModal({
  board,
  onClose,
  onSubmit,
}: EditBoardModalProps) {
  const { t } = useLocale();
  const [error, setError] = useState('');

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, t('validation.nameMinLength')).max(100),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/, t('validation.invalidColor')),
        isCompleted: z.boolean(),
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
      name: board.name,
      color: getBoardAccentColor(board.id, board.color, board.isCompleted),
      isCompleted: Boolean(board.isCompleted),
    },
  });

  const selectedColor = watch('color');

  useEffect(() => {
    reset({
      name: board.name,
      color: getBoardAccentColor(board.id, board.color, board.isCompleted),
      isCompleted: Boolean(board.isCompleted),
    });
  }, [board.id, board.name, board.color, board.isCompleted, reset]);

  const handleFormSubmit = async (data: FormData) => {
    setError('');

    const markingCompleted = data.isCompleted && !board.isCompleted;
    const incompleteCount = board.incompleteTaskCount ?? 0;

    if (markingCompleted && incompleteCount > 0) {
      const confirmed = confirm(
        incompleteCount === 1
          ? t('board.completeWithIncompleteConfirm', {
              count: incompleteCount,
            })
          : t('board.completeWithIncompleteConfirmPlural', {
              count: incompleteCount,
            }),
      );
      if (!confirmed) return;
    }

    try {
      await onSubmit(board.id, {
        name: data.name,
        color: data.isCompleted ? BOARD_COMPLETED_COLOR : data.color,
        isCompleted: data.isCompleted,
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <AppModal
      title={t('board.modals.editBoard')}
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
              label={t('board.boardName')}
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
            {BOARD_COLOR_OPTIONS.map((color) => (
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

        <Controller
          name="isCompleted"
          control={control}
          render={({ field }) => (
            <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700">
              <span>{t('board.markAsCompleted')}</span>
              <Switch
                checked={field.value}
                onChange={(checked) => {
                  field.onChange(checked);
                  if (checked) {
                    setValue('color', BOARD_COMPLETED_COLOR);
                  }
                }}
                aria-label={t('board.markAsCompleted')}
              />
            </label>
          )}
        />
      </form>
    </AppModal>
  );
}
