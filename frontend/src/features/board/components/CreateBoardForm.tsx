'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo, useState } from 'react';
import { useLocale } from '@/i18n/LocaleProvider';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import type { CreateBoardInput } from '../types';

type FormData = {
  name: string;
};

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
  const { t } = useLocale();
  const [error, setError] = useState('');
  const isModal = variant === 'modal';

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, t('validation.nameMinLength')).max(100),
      }),
    [t],
  );

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
          {t('board.createBoardModalHint')}
        </p>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Input
        label={t('board.boardName')}
        placeholder={t('board.boardNamePlaceholder')}
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
      <h3 className="mb-1 text-lg font-semibold text-gray-900">
        {t('board.modals.createBoard')}
      </h3>
      <p className="mb-4 text-sm text-gray-500">
        {t('board.createBoardDefaultColumnsHint')}
      </p>

      <div className="space-y-4">
        {formFields}
        <div className="flex gap-3">
          <Button type="submit" isLoading={isSubmitting}>
            {t('board.createBoard')}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </form>
  );
}
