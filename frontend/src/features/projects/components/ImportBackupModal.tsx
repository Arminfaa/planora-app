'use client';

import { useRef, useState } from 'react';
import { Button } from 'antd';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useLocale } from '@/i18n/LocaleProvider';
import { AppModal } from '@/shared/components/ui/AppModal';
import {
  projectService,
  type ProjectBackupImportResult,
} from '@/features/projects/services/project.service';

type ImportPhase = 'idle' | 'uploading' | 'restoring' | 'done' | 'error';

interface ImportBackupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: ProjectBackupImportResult) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImportBackupModal({
  open,
  onClose,
  onSuccess,
}: ImportBackupModalProps) {
  const { t } = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<ImportPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ProjectBackupImportResult | null>(null);

  const isBusy = phase === 'uploading' || phase === 'restoring';

  const resetState = () => {
    setFile(null);
    setPhase('idle');
    setProgress(0);
    setError('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (isBusy) return;
    resetState();
    onClose();
  };

  const handleFilePick = (picked: File | undefined) => {
    if (!picked || isBusy) return;
    setFile(picked);
    setError('');
    setPhase('idle');
    setProgress(0);
    setResult(null);
  };

  const handleRestore = async () => {
    if (!file || isBusy) return;

    setError('');
    setResult(null);
    setPhase('uploading');
    setProgress(0);

    try {
      const imported = await projectService.importBackup(file, {
        onUploadProgress: (percent) => {
          // Reserve the last ~15% for server-side restore work.
          setProgress(Math.min(85, Math.round(percent * 0.85)));
          if (percent >= 100) {
            setPhase('restoring');
            setProgress(90);
          }
        },
      });

      setPhase('restoring');
      setProgress(97);
      setResult(imported);
      setPhase('done');
      setProgress(100);

      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      onSuccess?.(imported);

      window.setTimeout(() => {
        resetState();
        onClose();
        router.push(`/dashboard/projects/${imported.projectSlug}`);
      }, 700);
    } catch (err) {
      setPhase('error');
      setProgress(0);
      setError(getApiErrorMessage(err));
    }
  };

  const phaseLabel =
    phase === 'uploading'
      ? t('projects.backupUploadProgress')
      : phase === 'restoring'
        ? t('projects.backupRestoreProgress')
        : phase === 'done'
          ? t('projects.backupRestoreComplete')
          : null;

  return (
    <AppModal
      open={open}
      title={t('projects.importBackup')}
      subtitle={t('projects.importBackupHint')}
      onClose={handleClose}
      maskClosable={!isBusy}
      width={520}
      modalProps={{ closable: !isBusy }}
      footer={
        <>
          <Button onClick={handleClose} disabled={isBusy}>
            {t('common.cancel')}
          </Button>
          <Button
            type="primary"
            disabled={!file || isBusy || phase === 'done'}
            loading={isBusy}
            onClick={() => void handleRestore()}
          >
            {isBusy
              ? t('projects.importingBackup')
              : t('projects.importBackup')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".planora,application/octet-stream,application/gzip,application/json"
          className="hidden"
          disabled={isBusy}
          onChange={(event) => {
            handleFilePick(event.target.files?.[0]);
          }}
        />

        <button
          type="button"
          disabled={isBusy}
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center transition hover:border-primary-300 hover:bg-primary-50/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            className="mb-2 h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <span className="text-sm font-medium text-gray-800">
            {file ? file.name : t('projects.chooseBackupFile')}
          </span>
          {file ? (
            <span className="mt-1 text-xs text-gray-500">
              {formatFileSize(file.size)}
            </span>
          ) : (
            <span className="mt-1 text-xs text-gray-500">.planora</span>
          )}
        </button>

        {(isBusy || phase === 'done') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs text-gray-600">
              <span>{phaseLabel}</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  phase === 'done' ? 'bg-emerald-500' : 'bg-primary-600'
                } ${phase === 'restoring' ? 'animate-pulse' : ''}`}
                style={{ width: `${Math.max(progress, 4)}%` }}
              />
            </div>
          </div>
        )}

        {error ? (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {result && phase === 'done' ? (
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {t('projects.importBackupSuccess', {
              name: result.projectName,
              boards: result.boards,
              tasks: result.tasks,
              members: result.members,
            })}
          </div>
        ) : null}
      </div>
    </AppModal>
  );
}
