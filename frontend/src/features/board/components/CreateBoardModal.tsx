'use client';

import { useState } from 'react';
import { Button } from 'antd';
import {
  CREATE_BOARD_FORM_ID,
  CreateBoardForm,
} from '@/features/board/components/CreateBoardForm';
import type { CreateBoardInput } from '@/features/board/types';
import { AppModal } from '@/shared/components/ui/AppModal';

interface CreateBoardModalProps {
  onSubmit: (data: CreateBoardInput) => Promise<void>;
  onClose: () => void;
}

export function CreateBoardModal({ onSubmit, onClose }: CreateBoardModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <AppModal
      title="New board"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            form={CREATE_BOARD_FORM_ID}
            loading={isSubmitting}
          >
            Create Board
          </Button>
        </>
      }
    >
      <CreateBoardForm
        onSubmit={async (data) => {
          await onSubmit(data);
          onClose();
        }}
        onCancel={onClose}
        variant="modal"
        onSubmittingChange={setIsSubmitting}
      />
    </AppModal>
  );
}
