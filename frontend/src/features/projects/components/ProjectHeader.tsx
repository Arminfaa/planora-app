'use client';

import Link from 'next/link';
import type { Project } from '../types';
import { formatDate } from '@/features/dashboard/utils/stats';
import { useLocale } from '@/i18n/LocaleProvider';
import { BackChevronIcon } from '@/shared/components/ui/BackChevronIcon';
import { SearchInput } from '@/shared/components/ui/SearchInput';

interface ProjectHeaderProps {
  project: Project;
  boardCount: number;
  memberCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNewBoard: () => void;
  canEditProject: boolean;
  canDeleteProject: boolean;
  canCreateBoard: boolean;
  onEditProject: () => void;
  onDeleteProject: () => void;
  isConnected: boolean;
  isJoined: boolean;
  lastRemoteUpdate?: Date | null;
}

export function ProjectHeader({
  project,
  boardCount,
  memberCount,
  searchQuery,
  onSearchChange,
  onNewBoard,
  canEditProject,
  canDeleteProject,
  canCreateBoard,
  onEditProject,
  onDeleteProject,
  isConnected,
  isJoined,
  lastRemoteUpdate,
}: ProjectHeaderProps) {
  const { t, locale } = useLocale();
  return (
    <header className="relative">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <BackChevronIcon />
        {t('projects.backToDashboard')}
      </Link>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {project.name}
          </h1>
          {project.description ? (
            <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-gray-600">
              {project.description}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
            <span>
              {boardCount === 1
                ? t('projects.boardCountLabel', { count: boardCount })
                : t('projects.boardCountLabelPlural', { count: boardCount })}
            </span>
            <span>·</span>
            <span>
              {memberCount === 1
                ? t('projects.memberCountLabel', { count: memberCount })
                : t('projects.memberCountLabelPlural', { count: memberCount })}
            </span>
            <span>·</span>
            <span>
              {t('projects.updatedAt', {
                date: formatDate(project.updatedAt, locale),
              })}
            </span>
            {project.owner && (
              <>
                <span>·</span>
                <span>
                  {t('projects.ownerPrefix', { name: project.owner.name })}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 text-xs text-gray-500 backdrop-blur-sm">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isConnected && isJoined
                  ? 'bg-emerald-500'
                  : isConnected
                    ? 'bg-amber-400'
                    : 'bg-gray-300'
              }`}
            />
            {isConnected && isJoined
              ? t('board.live')
              : isConnected
                ? t('board.joining')
                : t('board.connecting')}
            {lastRemoteUpdate && (
              <span className="hidden text-gray-400 sm:inline">
                · {lastRemoteUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>

          {canEditProject && (
            <button
              type="button"
              onClick={onEditProject}
              className="inline-flex items-center rounded-xl border border-gray-200 bg-white/80 px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white"
            >
              {t('common.edit')}
            </button>
          )}
          {canDeleteProject && (
            <button
              type="button"
              onClick={onDeleteProject}
              className="inline-flex items-center rounded-xl border border-red-200 bg-white/80 px-3.5 py-2.5 text-sm font-medium text-red-600 shadow-sm backdrop-blur-sm transition hover:bg-red-50"
            >
              {t('common.delete')}
            </button>
          )}

          <div className="min-w-[200px] flex-1 sm:min-w-[220px] sm:flex-none">
            <SearchInput
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t('projects.searchBoards')}
              aria-label={t('projects.searchBoardsAria')}
              className="rounded-xl border-gray-200 bg-white/80 shadow-sm backdrop-blur-sm"
            />
          </div>

          {canCreateBoard && (
            <button
              type="button"
              onClick={onNewBoard}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t('projects.newBoard')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
