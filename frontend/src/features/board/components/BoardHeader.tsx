'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { BoardColumn } from '../types';
import type { TaskFilters } from '@/features/search/types';
import {
  countActiveFilters,
  isTaskFiltersActive,
} from '@/features/search/utils/taskFilters';
import { BoardBackgroundMenu } from './BoardBackgroundMenu';

interface BoardHeaderProps {
  boardName: string;
  boardId: string;
  projectSlug: string;
  columnsCount: number;
  totalTasks: number;
  matchingTaskCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: TaskFilters;
  onOpenFilters: () => void;
  hasActiveView: boolean;
  backgroundUrl?: string | null;
  onBackgroundChange: (url: string | null) => void;
  canManageBackground?: boolean;
  isConnected: boolean;
  isJoined: boolean;
  lastRemoteUpdate?: Date | null;
}

export function BoardHeader({
  boardName,
  boardId,
  projectSlug,
  columnsCount,
  totalTasks,
  matchingTaskCount,
  searchQuery,
  onSearchChange,
  filters,
  onOpenFilters,
  hasActiveView,
  backgroundUrl,
  onBackgroundChange,
  canManageBackground = false,
  isConnected,
  isJoined,
  lastRemoteUpdate,
}: BoardHeaderProps) {
  const [showBackgroundMenu, setShowBackgroundMenu] = useState(false);
  const backgroundMenuRef = useRef<HTMLDivElement>(null);
  const activeFilterCount = countActiveFilters(filters);
  const hasQuery = searchQuery.trim().length > 0;

  useEffect(() => {
    if (!showBackgroundMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        backgroundMenuRef.current &&
        !backgroundMenuRef.current.contains(event.target as Node)
      ) {
        setShowBackgroundMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBackgroundMenu]);

  return (
    <header className="relative z-10 shrink-0">
      <Link
        href={`/dashboard/projects/${projectSlug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition hover:text-white"
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
        Back to project
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl">
            {boardName}
          </h1>
          <p className="mt-1.5 text-sm text-white/60">
            {columnsCount} columns · {totalTasks} tasks
            {hasActiveView && (
              <span className="text-white/80">
                {' '}
                · showing {matchingTaskCount}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isConnected && isJoined
                  ? 'bg-emerald-400'
                  : isConnected
                    ? 'bg-amber-400'
                    : 'bg-white/30'
              }`}
            />
            {isConnected && isJoined
              ? 'Live'
              : isConnected
                ? 'Joining...'
                : 'Connecting...'}
            {lastRemoteUpdate && (
              <span className="hidden text-white/50 sm:inline">
                · {lastRemoteUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>

          {canManageBackground && (
            <div className="relative" ref={backgroundMenuRef}>
              <button
                type="button"
                onClick={() => setShowBackgroundMenu((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
                aria-label="Board background settings"
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="hidden sm:inline">Background</span>
              </button>

              {showBackgroundMenu && (
                <BoardBackgroundMenu
                  boardId={boardId}
                  backgroundUrl={backgroundUrl}
                  onBackgroundChange={onBackgroundChange}
                  onClose={() => setShowBackgroundMenu(false)}
                />
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onOpenFilters}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium backdrop-blur-md transition ${
              isTaskFiltersActive(filters)
                ? 'border-primary-300 bg-primary-500/30 text-white'
                : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
            }`}
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filter
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="relative min-w-[200px] flex-1 sm:min-w-[260px] sm:flex-none">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-white/50">
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
              placeholder="Search tasks..."
              className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-9 pr-8 text-sm text-white placeholder:text-white/50 backdrop-blur-md focus:border-white/40 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Search tasks on board"
            />
            {hasQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-2 flex items-center text-white/50 hover:text-white"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
