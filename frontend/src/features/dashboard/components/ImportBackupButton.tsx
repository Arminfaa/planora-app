'use client';

import { useState } from 'react';
import { useLocale } from '@/i18n/LocaleProvider';
import { ImportBackupModal } from '@/features/projects/components/ImportBackupModal';

interface ImportBackupButtonProps {
  className?: string;
}

export function ImportBackupButton({ className }: ImportBackupButtonProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white"
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
        {t('dashboard.importBackup')}
      </button>

      {open ? (
        <ImportBackupModal open={open} onClose={() => setOpen(false)} />
      ) : null}
    </div>
  );
}
