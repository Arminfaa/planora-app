'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'antd';
import type { Board, UpdateBoardInput } from '../types';
import { useLocale } from '@/i18n/LocaleProvider';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import { AppModal } from '@/shared/components/ui/AppModal';

type FormData = {
  name: string;
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
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: board.name },
  });

  useEffect(() => {
    reset({ name: board.name });
  }, [board.id, reset]);

  const handleFormSubmit = async (data: FormData) => {
    setError('');
    try {
      await onSubmit(board.id, { name: data.name });
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
      </form>
    </AppModal>
  );
}
