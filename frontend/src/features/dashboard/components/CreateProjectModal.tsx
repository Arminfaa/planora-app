'use client';

import { useState } from 'react';
import { Button } from 'antd';
import { CREATE_PROJECT_FORM_ID, CreateProjectForm } from './CreateProjectForm';
import type { CreateProjectInput } from '@/features/projects/types';
import { AppModal } from '@/shared/components/ui/AppModal';
import { useLocale } from '@/i18n/LocaleProvider';

interface CreateProjectModalProps {
  onSubmit: (data: CreateProjectInput) => Promise<void>;
  onClose: () => void;
}

export function CreateProjectModal({
  onSubmit,
  onClose,
}: CreateProjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLocale();

  return (
    <AppModal
      title={t('dashboard.newProject')}
      onClose={onClose}
      width={672}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="primary"
            htmlType="submit"
            form={CREATE_PROJECT_FORM_ID}
            loading={isSubmitting}
          >
            {t('dashboard.createProjectForm.submit')}
          </Button>
        </>
      }
    >
      <CreateProjectForm
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
