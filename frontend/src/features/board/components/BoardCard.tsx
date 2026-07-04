'use client';

import Link from 'next/link';
import type { Board } from '../types';

const accentColors = [
  '#6366F1',
  '#8B5CF6',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EC4899',
];

function getAccentColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return accentColors[Math.abs(hash) % accentColors.length];
}

interface BoardCardProps {
  board: Board;
  projectSlug: string;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit: (board: Board) => void;
  onDelete: (board: Board) => void;
}

export function BoardCard({
  board,
  projectSlug,
  canEdit = true,
  canDelete = false,
  onEdit,
  onDelete,
}: BoardCardProps) {
  const columnCount = board._count?.columns ?? 0;
  const accent = getAccentColor(board.id);

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm transition hover:border-primary-200 hover:shadow-md">
      <div className="h-1" style={{ backgroundColor: accent }} />
      <div className="flex items-start justify-between gap-3 p-5">
        <Link
          href={`/dashboard/projects/${projectSlug}/boards/${board.slug}`}
          className="min-w-0 flex-1"
        >
          <h3 className="font-semibold text-gray-900 transition group-hover:text-primary-700">
            {board.name}
          </h3>
          <p className="mt-2 text-xs text-gray-500">
            {columnCount} column{columnCount === 1 ? '' : 's'}
          </p>
        </Link>

        <div className="flex shrink-0 gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(board)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label={`Edit ${board.name}`}
            >
              Edit
            </button>
          )}
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
