'use client';

import { useEffect } from 'react';
import type { BoardColumn } from '@/features/board/types';
import type { TaskFilters } from '../types/filter';
import { countActiveFilters } from '../utils/taskFilters';
import { BoardFilterForm } from './BoardFilterForm';
import { Button } from '@/shared/components/ui/Button';

interface BoardFilterModalProps {
  columns: BoardColumn[];
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  onClose: () => void;
}

export function BoardFilterModal({
  columns,
  filters,
  onChange,
  onClose,
}: BoardFilterModalProps) {
  const activeCount = countActiveFilters(filters);

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
        aria-labelledby="board-filter-title"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2
              id="board-filter-title"
              className="text-lg font-semibold text-gray-900"
            >
              Filter tasks
            </h2>
            {activeCount > 0 && (
              <p className="mt-0.5 text-sm text-gray-500">
                {activeCount} active filter{activeCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close filters"
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

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <BoardFilterForm
            columns={columns}
            filters={filters}
            onChange={onChange}
            variant="modal"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/80 px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
