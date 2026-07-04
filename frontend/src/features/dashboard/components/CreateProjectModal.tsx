'use client';

import { useState } from 'react';
import { Button } from 'antd';
import { CREATE_PROJECT_FORM_ID, CreateProjectForm } from './CreateProjectForm';
import type { CreateProjectInput } from '@/features/projects/types';
import { AppModal } from '@/shared/components/ui/AppModal';

interface CreateProjectModalProps {
  onSubmit: (data: CreateProjectInput) => Promise<void>;
  onClose: () => void;
}

export function CreateProjectModal({
  onSubmit,
  onClose,
}: CreateProjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <AppModal
      title="New project"
      onClose={onClose}
      width={672}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            form={CREATE_PROJECT_FORM_ID}
            loading={isSubmitting}
          >
            Create Project
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
