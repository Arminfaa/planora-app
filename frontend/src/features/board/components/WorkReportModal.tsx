'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/i18n/LocaleProvider';
import { AppModal } from '@/shared/components/ui/AppModal';
import { Button } from '@/shared/components/ui/Button';
import { copyText } from '@/lib/copyText';

interface WorkReportModalProps {
  text: string;
  onClose: () => void;
}

export function WorkReportModal({ text, onClose }: WorkReportModalProps) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    const ok = await copyText(text);
    if (ok) setCopied(true);
  };

  return (
    <AppModal
      title={t('board.workReport.title')}
      subtitle={t('board.workReport.subtitle')}
      onClose={onClose}
      width={640}
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="rounded-xl"
          >
            {t('common.close')}
          </Button>
          <Button
            type="button"
            onClick={() => void handleCopy()}
            className="rounded-xl"
          >
            {copied ? t('common.copied') : t('common.copy')}
          </Button>
        </div>
      }
    >
      <pre className="max-h-[min(60vh,520px)] overflow-auto whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-7 text-gray-800">
        {text}
      </pre>
    </AppModal>
  );
}
