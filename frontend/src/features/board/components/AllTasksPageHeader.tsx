'use client';

import Link from 'next/link';
import { useLocale } from '@/i18n/LocaleProvider';
import { BackChevronIcon } from '@/shared/components/ui/BackChevronIcon';
import { Button } from '@/shared/components/ui/Button';
import { AllTasksOperationsMenu } from './AllTasksBulkToolbar';
import type { BulkOperationMode } from '@/features/tasks/types/bulkActions';

interface AllTasksPageHeaderProps {
  projectSlug: string;
  scope: 'board' | 'project';
  boardSlug?: string;
  boardName?: string;
  projectName?: string;
  totalTasks: number;
  visibleTasks: number;
  hasActiveView: boolean;
  selectionMode: BulkOperationMode | null;
  canCreateTasks: boolean;
  canMoveTasks: boolean;
  canEditTasks: boolean;
  canAssignLabels: boolean;
  canDeleteTasks: boolean;
  onCreate: () => void;
  onImport: () => void;
  onSelectOperation: (mode: BulkOperationMode) => void;
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
      />
    </svg>
  );
}

export function AllTasksPageHeader({
  projectSlug,
  scope,
  boardSlug,
  boardName,
  projectName,
  totalTasks,
  visibleTasks,
  hasActiveView,
  selectionMode,
  canCreateTasks,
  canMoveTasks,
  canEditTasks,
  canAssignLabels,
  canDeleteTasks,
  onCreate,
  onImport,
  onSelectOperation,
}: AllTasksPageHeaderProps) {
  const { t } = useLocale();
  const isSelecting = selectionMode !== null;
  const isBoardScope = scope === 'board';

  const backHref = isBoardScope
    ? `/dashboard/projects/${projectSlug}/boards/${boardSlug}`
    : `/dashboard/projects/${projectSlug}`;
  const backLabel = isBoardScope
    ? t('board.backToBoard')
    : t('board.backToProject');

  const title = isBoardScope
    ? t('board.allTasksNamed', { name: boardName ?? '' })
    : t('board.allTasks');

  return (
    <header className="space-y-5">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <BackChevronIcon />
        {backLabel}
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {!isBoardScope && projectName ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
              {projectName}
            </p>
          ) : null}
          <h1
            className={`text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl ${
              !isBoardScope && projectName ? 'mt-1' : ''
            }`}
          >
            {title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {totalTasks === 1
                ? t('board.taskCount', { count: totalTasks })
                : t('board.taskCountPlural', { count: totalTasks })}
            </span>
            {hasActiveView && (
              <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                {t('board.showingCount', { count: visibleTasks })}
              </span>
            )}
            {isSelecting && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                {t('board.bulkModeActive', {
                  action: t(`board.bulkOps.${selectionMode}`),
                })}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AllTasksOperationsMenu
            canMoveTasks={canMoveTasks}
            canEditTasks={canEditTasks}
            canAssignLabels={canAssignLabels}
            canDeleteTasks={canDeleteTasks}
            activeMode={selectionMode}
            onSelect={onSelectOperation}
          />

          {canCreateTasks && !isSelecting && (
            <Button
              type="button"
              variant="secondary"
              onClick={onImport}
              aria-label={t('board.importAriaLabel')}
              className="rounded-xl"
            >
              <UploadIcon className="me-2 h-4 w-4" />
              {t('board.importExcel')}
            </Button>
          )}

          {canCreateTasks && !isSelecting && (
            <Button
              type="button"
              onClick={onCreate}
              className="rounded-xl shadow-sm"
            >
              <PlusIcon className="me-2 h-4 w-4" />
              {t('board.newTask')}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
