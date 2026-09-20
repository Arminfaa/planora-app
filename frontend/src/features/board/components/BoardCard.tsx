'use client';

import Link from 'next/link';
import type { Board } from '../types';
import { getBoardAccentColor } from '../utils/boardAccentColor';
import { useLocale } from '@/i18n/LocaleProvider';

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
  const { t } = useLocale();
  const columnCount = board._count?.columns ?? 0;
  const accent = getBoardAccentColor(board.id, board.color);
  const isCompleted = Boolean(board.isCompleted);

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm transition hover:border-primary-200 hover:shadow-md">
      <div className="h-1" style={{ backgroundColor: accent }} />
      <div className="flex items-start justify-between gap-3 p-5">
        <Link
          href={`/dashboard/projects/${projectSlug}/boards/${board.slug}`}
          className="min-w-0 flex-1"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900 transition group-hover:text-primary-700">
              {board.name}
            </h3>
            {isCompleted && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                {t('board.completed')}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {columnCount === 1
              ? t('board.columnCount', { count: columnCount })
              : t('board.columnCountPlural', { count: columnCount })}
          </p>
        </Link>

        <div className="flex shrink-0 gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(board)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label={t('board.editColumnNamed', { name: board.name })}
            >
              {t('common.edit')}
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(board)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
              aria-label={t('board.deleteColumnNamedAria', {
                name: board.name,
              })}
            >
              {t('common.delete')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
