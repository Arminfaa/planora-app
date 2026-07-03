'use client';

import { useEffect } from 'react';
import { CreateProjectForm } from './CreateProjectForm';
import type { CreateProjectInput } from '@/features/projects/types';

interface CreateProjectModalProps {
  onSubmit: (data: CreateProjectInput) => Promise<void>;
  onClose: () => void;
}

export function CreateProjectModal({
  onSubmit,
  onClose,
}: CreateProjectModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2
            id="create-project-title"
            className="text-lg font-semibold text-gray-900"
          >
            New project
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
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
        <div className="p-6">
          <CreateProjectForm
            onSubmit={async (data) => {
              await onSubmit(data);
              onClose();
            }}
            onCancel={onClose}
            variant="modal"
          />
        </div>
      </div>
    </div>
  );
}
