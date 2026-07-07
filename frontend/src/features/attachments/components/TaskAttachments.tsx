'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { attachmentService } from '../services/attachment.service';
import type { TaskAttachment } from '../types';
import { useLocale } from '@/i18n/LocaleProvider';
import { Button } from '@/shared/components/ui/Button';
import { getApiErrorMessage } from '@/lib/api';
import { getAssetUrl, isImageAttachment } from '@/lib/assets';
import { AssetImage } from '@/shared/components/ui/AssetImage';
import { formatFileSize } from '../utils/format';

interface TaskAttachmentsProps {
  taskId: string;
}

export function TaskAttachments({ taskId }: TaskAttachmentsProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const loadAttachments = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await attachmentService.list(taskId);
      setAttachments(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void loadAttachments();
  }, [loadAttachments]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError('');
    try {
      await attachmentService.upload(taskId, file);
      await loadAttachments();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm(t('attachments.deleteConfirm'))) return;

    setError('');
    try {
      await attachmentService.remove(taskId, attachmentId);
      await loadAttachments();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">
          {t('attachments.title')}
        </h3>
        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,.zip"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
          <Button
            type="button"
            className="px-3 py-1.5 text-xs"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            isLoading={isUploading}
          >
            {t('attachments.upload')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">
          {t('attachments.loadingAttachments')}
        </p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-gray-500">
          {t('attachments.noAttachments')}
        </p>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const assetUrl = getAssetUrl(attachment.url);
            const isImage = isImageAttachment(
              attachment.type,
              attachment.mimeType,
            );

            return (
              <div
                key={attachment.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
              >
                <div className="min-w-0 flex-1">
                  {isImage ? (
                    <a
                      href={assetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <AssetImage
                        src={assetUrl}
                        alt={attachment.filename}
                        width={800}
                        height={600}
                        resolveAsset={false}
                        className="max-h-48 w-full max-w-full rounded-md border border-gray-200 bg-white object-contain"
                        style={{
                          width: 'auto',
                          height: 'auto',
                          maxHeight: '12rem',
                        }}
                      />
                    </a>
                  ) : (
                    <a
                      href={assetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      {attachment.filename}
                    </a>
                  )}
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {attachment.filename} · {formatFileSize(attachment.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => void handleDelete(attachment.id)}
                >
                  {t('common.delete')}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
