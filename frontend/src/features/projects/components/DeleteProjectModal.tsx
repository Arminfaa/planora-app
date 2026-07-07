'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Project } from '../types';
import { useLocale } from '@/i18n/LocaleProvider';
import { AppModal } from '@/shared/components/ui/AppModal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

interface DeleteProjectModalProps {
  project: Project;
  boardCount: number;
  memberCount: number;
  open: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function hasProjectDeleteDependencies(
  boardCount: number,
  memberCount: number,
): boolean {
  return boardCount > 0 || memberCount > 1;
}

export function DeleteProjectModal({
  project,
  boardCount,
  memberCount,
  open,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteProjectModalProps) {
  const { t } = useLocale();
  const [confirmationName, setConfirmationName] = useState('');

  const requiresNameConfirmation = hasProjectDeleteDependencies(
    boardCount,
    memberCount,
  );

  const isNameMatch = useMemo(() => {
    if (!requiresNameConfirmation) return true;
    return confirmationName.trim() === project.name;
  }, [confirmationName, project.name, requiresNameConfirmation]);

  useEffect(() => {
    if (!open) {
      setConfirmationName('');
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!isNameMatch || isDeleting) return;
    await onConfirm();
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t('projects.deleteProjectModalTitle')}
      subtitle={project.name}
      width={480}
      maskClosable={!isDeleting}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            className="border border-red-300 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
            disabled={!isNameMatch || isDeleting}
            isLoading={isDeleting}
            onClick={() => void handleConfirm()}
          >
            {isDeleting ? t('common.deleting') : t('settings.deleteProject')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {requiresNameConfirmation ? (
          <>
            <p className="text-sm text-gray-600">
              {t('projects.deleteProjectModalDependenciesDescription')}
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
              {boardCount > 0 && (
                <li>
                  {boardCount === 1
                    ? t('projects.deleteProjectDependencyBoard', {
                        count: boardCount,
                      })
                    : t('projects.deleteProjectDependencyBoards', {
                        count: boardCount,
                      })}
                </li>
              )}
              {memberCount > 1 && (
                <li>
                  {t('projects.deleteProjectDependencyMembers', {
                    count: memberCount,
                  })}
                </li>
              )}
            </ul>
            <p className="text-sm text-gray-600">
              {t('projects.deleteProjectTypeNamePrompt', { name: project.name })}
            </p>
            <Input
              value={confirmationName}
              onChange={(event) => setConfirmationName(event.target.value)}
              placeholder={project.name}
              autoComplete="off"
              disabled={isDeleting}
              aria-label={t('projects.deleteProjectTypeNameLabel')}
            />
          </>
        ) : (
          <p className="text-sm text-gray-600">
            {t('projects.deleteProjectModalSimpleDescription', {
              name: project.name,
            })}
          </p>
        )}
      </div>
    </AppModal>
  );
}
