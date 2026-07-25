'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiErrorMessage } from '@/lib/api';
import { useLocale } from '@/i18n/LocaleProvider';
import { projectService } from '../services/project.service';

interface ProjectBackupPanelProps {
  projectId: string;
  projectSlug: string;
  canExport: boolean;
  /** When true, also show restore (creates a new project). */
  canImport?: boolean;
  onImported?: () => void;
}

export function ProjectBackupPanel({
  projectId,
  projectSlug,
  canExport,
  canImport = false,
  onImported,
}: ProjectBackupPanelProps) {
  const { t } = useLocale();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleExport = async () => {
    setError('');
    setMessage('');
    setIsExporting(true);
    try {
      await projectService.downloadBackup(projectId, projectSlug);
      setMessage(t('projects.exportBackupSuccess'));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setMessage('');
    setIsImporting(true);
    try {
      const result = await projectService.importBackup(file);
      setMessage(
        t('projects.importBackupSuccess', {
          name: result.projectName,
          boards: result.boards,
          tasks: result.tasks,
          members: result.members,
        }),
      );
      onImported?.();
      router.push(`/dashboard/projects/${result.projectSlug}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!canExport && !canImport) {
    return null;
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        {t('projects.backupTitle')}
      </h2>
      <p className="mt-1 text-sm text-gray-500">{t('projects.backupHint')}</p>
      <p className="mt-2 text-xs text-amber-800">
        {t('projects.backupSecurityNote')}
      </p>

      {error ? (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {canExport ? (
          <button
            type="button"
            disabled={isExporting}
            onClick={() => void handleExport()}
            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting
              ? t('projects.exportingBackup')
              : t('projects.exportBackup')}
          </button>
        ) : null}

        {canImport ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".planora,application/octet-stream,application/gzip,application/json"
              className="hidden"
              onChange={(event) => {
                void handleImportFile(event.target.files?.[0]);
              }}
            />
            <button
              type="button"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImporting
                ? t('projects.importingBackup')
                : t('projects.importBackup')}
            </button>
          </>
        ) : null}
      </div>

      {canImport ? (
        <p className="mt-3 text-xs text-gray-500">
          {t('projects.importBackupHint')}
        </p>
      ) : null}
    </section>
  );
}
