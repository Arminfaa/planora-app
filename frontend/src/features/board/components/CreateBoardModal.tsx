'use client';

import { useState } from 'react';
import { Button } from 'antd';
import {
  CREATE_BOARD_FORM_ID,
  CreateBoardForm,
} from '@/features/board/components/CreateBoardForm';
import type { CreateBoardInput } from '@/features/board/types';
import { useLocale } from '@/i18n/LocaleProvider';
import { AppModal } from '@/shared/components/ui/AppModal';

interface CreateBoardModalProps {
  onSubmit: (data: CreateBoardInput) => Promise<void>;
  onClose: () => void;
}

export function CreateBoardModal({ onSubmit, onClose }: CreateBoardModalProps) {
  const { t } = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <AppModal
      title={t('projects.newBoard')}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="primary"
            htmlType="submit"
            form={CREATE_BOARD_FORM_ID}
            loading={isSubmitting}
          >
            {t('board.createBoard')}
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
