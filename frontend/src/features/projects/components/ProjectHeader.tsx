'use client';

import Link from 'next/link';
import type { Project } from '../types';
import { formatDate } from '@/features/dashboard/utils/stats';

interface ProjectHeaderProps {
  project: Project;
  boardCount: number;
  memberCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNewBoard: () => void;
  canManageProject: boolean;
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
  canManageProject,
  onEditProject,
  onDeleteProject,
  isConnected,
  isJoined,
  lastRemoteUpdate,
}: ProjectHeaderProps) {
  const hasQuery = searchQuery.trim().length > 0;

  return (
    <header className="relative">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to dashboard
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
              {boardCount} board{boardCount === 1 ? '' : 's'}
            </span>
            <span>·</span>
            <span>
              {memberCount} member{memberCount === 1 ? '' : 's'}
            </span>
            <span>·</span>
            <span>Updated {formatDate(project.updatedAt)}</span>
            {project.owner && (
              <>
                <span>·</span>
                <span>Owner {project.owner.name}</span>
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
              ? 'Live'
              : isConnected
                ? 'Joining...'
                : 'Connecting...'}
            {lastRemoteUpdate && (
              <span className="hidden text-gray-400 sm:inline">
                · {lastRemoteUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>

          {canManageProject && (
            <>
              <button
                type="button"
                onClick={onEditProject}
                className="inline-flex items-center rounded-xl border border-gray-200 bg-white/80 px-3.5 py-2.5 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onDeleteProject}
                className="inline-flex items-center rounded-xl border border-red-200 bg-white/80 px-3.5 py-2.5 text-sm font-medium text-red-600 shadow-sm backdrop-blur-sm transition hover:bg-red-50"
              >
                Delete
              </button>
            </>
          )}

          <div className="relative min-w-[200px] flex-1 sm:min-w-[220px] sm:flex-none">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search boards..."
              className="w-full rounded-xl border border-gray-200 bg-white/80 py-2.5 pl-9 pr-8 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm backdrop-blur-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              aria-label="Search boards"
            />
            {hasQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

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
            New Board
          </button>
        </div>
      </div>
    </header>
  );
}
