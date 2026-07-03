'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BoardTask } from '@/features/board/types';
import { attachmentService } from '../services/attachment.service';
import type { TaskAttachment } from '../types';
import { formatFileSize, getFileKind } from '../utils/format';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { getApiErrorMessage } from '@/lib/api';
import { getAssetUrl, isImageAttachment } from '@/lib/assets';

interface TaskAttachmentsPreviewModalProps {
  task: BoardTask;
  onClose: () => void;
}

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
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="attachments-preview-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="attachments-preview-title"
              className="truncate text-base font-semibold text-gray-900"
            >
              {task.title}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {isLoading
                ? 'Loading...'
                : `${attachments.length} attachment${attachments.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
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
              No attachments
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
                          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-1.5 text-gray-600 shadow-sm transition hover:text-gray-900"
                          aria-label="Previous image"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={showNextImage}
                          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-1.5 text-gray-600 shadow-sm transition hover:text-gray-900"
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
                        className="block max-h-[40vh] max-w-full"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeImageUrl}
                          alt={activeImage.filename}
                          className="max-h-[40vh] max-w-full object-contain"
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
                        Open
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
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getAssetUrl(image.url)}
                            alt={image.filename}
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
                            Open
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
