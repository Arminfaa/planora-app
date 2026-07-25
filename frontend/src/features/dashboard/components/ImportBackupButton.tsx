'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { useLocale } from '@/i18n/LocaleProvider';
import { projectService } from '@/features/projects/services/project.service';

interface ImportBackupButtonProps {
  className?: string;
}

export function ImportBackupButton({ className }: ImportBackupButtonProps) {
  const { t } = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setIsImporting(true);
    try {
      const result = await projectService.importBackup(file);
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
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

  return (
    <div className={className}>
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
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        {isImporting
          ? t('dashboard.importingBackup')
          : t('dashboard.importBackup')}
      </button>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
