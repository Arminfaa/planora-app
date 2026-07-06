'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'antd';
import type { Board, UpdateBoardInput } from '../types';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import { AppModal } from '@/shared/components/ui/AppModal';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

type FormData = z.infer<typeof schema>;

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
  const [error, setError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: { name: board.name },
  });

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
      title="Edit Board"
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
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              label="Board Name"
              error={errors.name?.message}
              {...field}
            />
          )}
        />
      </form>
    </AppModal>
  );
}
