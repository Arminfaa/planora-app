'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Tooltip } from 'antd';
import type { BoardTask } from '@/features/board/types';
import { attachmentService } from '../services/attachment.service';
import type { TaskAttachment } from '../types';
import {
  formatFileSize,
  getFileKind,
  isWebAttachmentUrl,
} from '../utils/format';
import { useLocale } from '@/i18n/LocaleProvider';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { getApiErrorMessage } from '@/lib/api';
import { copyText } from '@/lib/copyText';
import { getAssetUrl, isImageAttachment } from '@/lib/assets';
import { AssetImage } from '@/shared/components/ui/AssetImage';
import { AppModal } from '@/shared/components/ui/AppModal';

interface TaskAttachmentsPreviewModalProps {
  task: BoardTask;
  onClose: () => void;
}

export function TaskAttachmentsPreviewModal({
  task,
  onClose,
}: TaskAttachmentsPreviewModalProps) {
  const { t } = useLocale();
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedPathId, setCopiedPathId] = useState<string | null>(null);

  const loadAttachments = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await attachmentService.list(task.id);
      setAttachments(data);
      setActiveImageIndex(0);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [task.id]);

  useEffect(() => {
    void loadAttachments();
  }, [loadAttachments]);

  const images = attachments.filter((item) =>
    isImageAttachment(item.type, item.mimeType),
  );
  const files = attachments.filter(
    (item) =>
      item.type !== 'LINK' && !isImageAttachment(item.type, item.mimeType),
  );
  const links = attachments.filter((item) => item.type === 'LINK');

  const handleCopyPath = async (attachmentId: string, path: string) => {
    const ok = await copyText(path);
    if (!ok) return;
    setCopiedPathId(attachmentId);
    window.setTimeout(() => {
      setCopiedPathId((current) => (current === attachmentId ? null : current));
    }, 2000);
  };

  const activeImage = images[activeImageIndex];
  const activeImageUrl = activeImage ? getAssetUrl(activeImage.url) : '';

  const showPrevImage = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((index) =>
      index === 0 ? images.length - 1 : index - 1,
    );
  };

  const showNextImage = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((index) =>
      index === images.length - 1 ? 0 : index + 1,
    );
  };

  const attachmentSubtitle = isLoading
    ? t('common.loading')
    : attachments.length === 1
      ? t('attachments.countSingular', { count: attachments.length })
      : t('attachments.countPlural', { count: attachments.length });

  return (
    <AppModal
      title={task.title}
      subtitle={attachmentSubtitle}
      onClose={onClose}
      width={512}
      zIndex={1060}
      footer={
        <Button type="primary" onClick={onClose}>
          {t('common.close')}
        </Button>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[180px] items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : attachments.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">
          {t('attachments.noAttachmentsShort')}
        </p>
      ) : (
        <div className="space-y-4">
          {images.length > 0 && (
            <div>
              <div className="relative flex min-h-[200px] items-center justify-center rounded-xl bg-gray-50 p-3">
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPrevImage}
                      className="absolute start-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-1.5 text-gray-600 shadow-sm transition hover:text-gray-900"
                      aria-label={t('attachments.previousImage')}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={showNextImage}
                      className="absolute end-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-1.5 text-gray-600 shadow-sm transition hover:text-gray-900"
                      aria-label={t('attachments.nextImage')}
                    >
                      ›
                    </button>
                  </>
                )}

                {activeImage && (
                  <a
                    href={activeImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="relative block max-h-[40vh] min-h-[120px] w-full max-w-full"
                  >
                    <AssetImage
                      src={activeImageUrl}
                      alt={activeImage.filename}
                      fill
                      resolveAsset={false}
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 600px"
                    />
                  </a>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-gray-900">
                    {activeImage?.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activeImage && formatFileSize(activeImage.size)}
                    {images.length > 1 && (
                      <span>
                        {' '}
                        · {activeImageIndex + 1}/{images.length}
                      </span>
                    )}
                  </p>
                </div>
                {activeImage && (
                  <a
                    href={activeImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    {t('attachments.open')}
                  </a>
                )}
              </div>

              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`shrink-0 overflow-hidden rounded-md border-2 transition ${
                        index === activeImageIndex
                          ? 'border-primary-500'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <AssetImage
                        src={getAssetUrl(image.url)}
                        alt={image.filename}
                        width={44}
                        height={44}
                        resolveAsset={false}
                        className="h-11 w-11 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {files.length > 0 && (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
              {files.map((attachment) => {
                const assetUrl = getAssetUrl(attachment.url);
                const kind = getFileKind(
                  attachment.mimeType,
                  attachment.filename,
                );

                return (
                  <li key={attachment.id}>
                    <a
                      href={assetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 px-3 py-2.5 transition hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-gray-900">
                          {attachment.filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {kind.toUpperCase()} ·{' '}
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-primary-600">
                        {t('attachments.open')}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}

          {links.length > 0 && (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
              {links.map((attachment) => {
                const isWebLink = isWebAttachmentUrl(attachment.url);
                const pathCopied = copiedPathId === attachment.id;
                const subtitle = isWebLink
                  ? `${t('attachments.linkLabel')} · ${attachment.url}`
                  : `${t('attachments.folderPathLabel')} · ${attachment.url}`;

                if (isWebLink) {
                  return (
                    <li key={attachment.id}>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 px-3 py-2.5 transition hover:bg-gray-50"
                      >
                        <div className="min-w-0 flex-1">
                          <Tooltip title={attachment.url}>
                            <p className="truncate text-sm text-gray-900">
                              {attachment.filename}
                            </p>
                          </Tooltip>
                          <Tooltip title={attachment.url}>
                            <p className="truncate text-xs text-gray-500">
                              {subtitle}
                            </p>
                          </Tooltip>
                        </div>
                        <span className="shrink-0 text-xs text-primary-600">
                          {t('attachments.open')}
                        </span>
                      </a>
                    </li>
                  );
                }

                return (
                  <li key={attachment.id}>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopyPath(attachment.id, attachment.url)
                      }
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-start transition hover:bg-gray-50"
                    >
                      <div className="min-w-0 flex-1">
                        <Tooltip title={attachment.url}>
                          <p className="truncate text-sm text-gray-900">
                            {attachment.filename}
                          </p>
                        </Tooltip>
                        <Tooltip title={attachment.url}>
                          <p className="truncate text-xs text-gray-500">
                            {subtitle}
                          </p>
                        </Tooltip>
                      </div>
                      <span className="shrink-0 text-xs text-primary-600">
                        {pathCopied
                          ? t('attachments.pathCopied')
                          : t('attachments.copyPath')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </AppModal>
  );
}
