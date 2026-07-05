'use client';

import { useRef, useState } from 'react';
import { boardService } from '../services/board.service';
import { getApiErrorMessage } from '@/lib/api';
import { AssetImage } from '@/shared/components/ui/AssetImage';

interface BoardBackgroundMenuProps {
  boardId: string;
  backgroundUrl?: string | null;
  onBackgroundChange: (url: string | null) => void;
  onClose: () => void;
}

export function BoardBackgroundMenu({
  boardId,
  backgroundUrl,
  onBackgroundChange,
  onClose,
}: BoardBackgroundMenuProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError('');
    try {
      const board = await boardService.uploadBackground(boardId, file);
      onBackgroundChange(board.backgroundUrl ?? null);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remove the custom board background?')) return;

    setIsRemoving(true);
    setError('');
    try {
      await boardService.removeBackground(boardId);
      onBackgroundChange(null);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-white/20 bg-white/95 shadow-xl backdrop-blur-md">
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-semibold text-gray-900">Board background</p>
        <p className="mt-0.5 text-xs text-gray-500">
          Upload a custom image for this board
        </p>
      </div>

      {backgroundUrl && (
        <div className="relative mx-4 mt-3 h-24 overflow-hidden rounded-lg">
          <AssetImage
            src={backgroundUrl}
            alt="Current board background"
            fill
            className="object-cover"
            sizes="200px"
          />
        </div>
      )}

      {error && (
        <p className="mx-4 mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="space-y-1 p-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleUpload(file);
          }}
        />
        <button
          type="button"
          disabled={isUploading || isRemoving}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </span>
          {isUploading ? 'Uploading...' : 'Upload image'}
        </button>

        {backgroundUrl && (
          <button
            type="button"
            disabled={isUploading || isRemoving}
            onClick={() => void handleRemove()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </span>
            {isRemoving ? 'Removing...' : 'Remove background'}
          </button>
        )}
      </div>
    </div>
  );
}
