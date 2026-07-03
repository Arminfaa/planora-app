'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BoardTask } from '@/features/board/types';
import { attachmentService } from '../services/attachment.service';
import type { TaskAttachment } from '../types';
import { formatFileSize, getFileKind, type FileKind } from '../utils/format';
import { Button } from '@/shared/components/ui/Button';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { getApiErrorMessage } from '@/lib/api';
import { getAssetUrl, isImageAttachment } from '@/lib/assets';

interface TaskAttachmentsPreviewModalProps {
  task: BoardTask;
  onClose: () => void;
}

const fileKindStyles: Record<
  FileKind,
  { label: string; badge: string; icon: string }
> = {
  pdf: { label: 'PDF', badge: 'bg-red-100 text-red-700', icon: '📄' },
  text: { label: 'Text', badge: 'bg-slate-100 text-slate-700', icon: '📝' },
  archive: {
    label: 'Archive',
    badge: 'bg-amber-100 text-amber-700',
    icon: '🗂️',
  },
  file: { label: 'File', badge: 'bg-gray-100 text-gray-700', icon: '📎' },
};

export function TaskAttachmentsPreviewModal({
  task,
  onClose,
}: TaskAttachmentsPreviewModalProps) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const images = attachments.filter((item) =>
    isImageAttachment(item.type, item.mimeType),
  );
  const files = attachments.filter(
    (item) => !isImageAttachment(item.type, item.mimeType),
  );

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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="attachments-preview-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 px-6 py-5 text-white">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 left-1/3 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-white/80">
                Attachments
              </p>
              <h2
                id="attachments-preview-title"
                className="mt-1 truncate text-lg font-semibold sm:text-xl"
              >
                {task.title}
              </h2>
              <p className="mt-1 text-sm text-white/85">
                {attachments.length} file{attachments.length === 1 ? '' : 's'}
                {images.length > 0 && files.length > 0 && (
                  <span>
                    {' '}
                    · {images.length} image{images.length === 1 ? '' : 's'} ·{' '}
                    {files.length} document{files.length === 1 ? '' : 's'}
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/25"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : attachments.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 text-center">
              <div className="mb-3 text-4xl">📎</div>
              <p className="font-medium text-gray-900">No attachments yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Open the task editor to upload files.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {images.length > 0 && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Images
                  </h3>

                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="relative flex min-h-[280px] items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2ff)] p-4 sm:min-h-[360px]">
                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={showPrevImage}
                            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow-md transition hover:bg-white"
                            aria-label="Previous image"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={showNextImage}
                            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow-md transition hover:bg-white"
                            aria-label="Next image"
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
                          className="block max-h-[50vh] max-w-full"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activeImageUrl}
                            alt={activeImage.filename}
                            className="max-h-[50vh] max-w-full rounded-lg object-contain shadow-lg"
                          />
                        </a>
                      )}
                    </div>

                    <div className="border-t border-gray-100 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {activeImage?.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activeImage && formatFileSize(activeImage.size)}
                            {images.length > 1 && (
                              <span>
                                {' '}
                                · {activeImageIndex + 1} of {images.length}
                              </span>
                            )}
                          </p>
                        </div>
                        {activeImage && (
                          <a
                            href={activeImageUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button
                              type="button"
                              className="px-3 py-1.5 text-xs"
                            >
                              Open full size
                            </Button>
                          </a>
                        )}
                      </div>

                      {images.length > 1 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                          {images.map((image, index) => {
                            const thumbUrl = getAssetUrl(image.url);
                            const isActive = index === activeImageIndex;

                            return (
                              <button
                                key={image.id}
                                type="button"
                                onClick={() => setActiveImageIndex(index)}
                                className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${
                                  isActive
                                    ? 'border-primary-500 ring-2 ring-primary-100'
                                    : 'border-transparent opacity-80 hover:opacity-100'
                                }`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={thumbUrl}
                                  alt={image.filename}
                                  className="h-16 w-16 object-cover"
                                />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {files.length > 0 && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Files
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {files.map((attachment) => {
                      const assetUrl = getAssetUrl(attachment.url);
                      const kind = getFileKind(
                        attachment.mimeType,
                        attachment.filename,
                      );
                      const style = fileKindStyles[kind];

                      return (
                        <div
                          key={attachment.id}
                          className="group flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary-200 hover:shadow-md"
                        >
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${style.badge}`}
                          >
                            {style.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {attachment.filename}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {style.label} · {formatFileSize(attachment.size)}
                            </p>
                            <a
                              href={assetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex text-xs font-medium text-primary-600 hover:text-primary-700"
                            >
                              Download / Open →
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
