'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BoardBackgroundMenu } from './BoardBackgroundMenu';

interface BoardHeaderProps {
  boardName: string;
  boardId: string;
  projectSlug: string;
  boardSlug: string;
  columnsCount: number;
  totalTasks: number;
  backgroundUrl?: string | null;
  onBackgroundChange: (url: string | null) => void;
  canManageBackground?: boolean;
  canViewTasks?: boolean;
  isConnected: boolean;
  isJoined: boolean;
  lastRemoteUpdate?: Date | null;
}

export function BoardHeader({
  boardName,
  boardId,
  projectSlug,
  boardSlug,
  columnsCount,
  totalTasks,
  backgroundUrl,
  onBackgroundChange,
  canManageBackground = false,
  canViewTasks = true,
  isConnected,
  isJoined,
  lastRemoteUpdate,
}: BoardHeaderProps) {
  const [showBackgroundMenu, setShowBackgroundMenu] = useState(false);
  const backgroundMenuRef = useRef<HTMLDivElement>(null);

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

          {canViewTasks && (
            <Link
              href={`/dashboard/projects/${projectSlug}/boards/${boardSlug}/tasks`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
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
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              All tasks
            </Link>
          )}

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
        </div>
      </div>
    </header>
  );
}
