'use client';

import Link from 'next/link';
import type { Board } from '../types';

interface BoardCardProps {
  board: Board;
  projectSlug: string;
  canDelete?: boolean;
  onEdit: (board: Board) => void;
  onDelete: (board: Board) => void;
}

export function BoardCard({
  board,
  projectSlug,
  canDelete = false,
  onEdit,
  onDelete,
}: BoardCardProps) {
  const columnCount = board._count?.columns ?? 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/dashboard/projects/${projectSlug}/boards/${board.id}`}
          className="min-w-0 flex-1"
        >
          <h3 className="font-semibold text-gray-900 hover:text-primary-700">
            {board.name}
          </h3>
          <div className="mt-3 flex gap-4 text-xs text-gray-500">
            <span>{columnCount} columns</span>
          </div>
        </Link>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onEdit(board)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label={`Edit ${board.name}`}
          >
            Edit
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(board)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
              aria-label={`Delete ${board.name}`}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
