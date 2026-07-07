'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatDate } from '@/features/dashboard/utils/stats';
import { useLocale } from '@/i18n/LocaleProvider';
import { useProjectBoardSocket } from '../hooks/useProjectBoardSocket';
import { useProjectContext } from '../context/ProjectContext';
import { ProjectSubNav } from './ProjectSubNav';

interface ProjectLayoutShellProps {
  children: ReactNode;
}

export function ProjectLayoutShell({ children }: ProjectLayoutShellProps) {
  const { t } = useLocale();
  const { project, memberCount, boardCount } = useProjectContext();

  const { isConnected, isJoined, lastRemoteUpdate } = useProjectBoardSocket(
    project.id,
  );

  const roleLabel =
    project.currentUserRoleName ??
    (project.currentUserRole === 'OWNER'
      ? t('team.owner')
      : project.currentUserRole === 'ADMIN'
        ? t('team.admin')
        : t('team.member'));

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="relative shrink-0 overflow-hidden border-b border-indigo-100/60 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(99,102,241,0.12),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(139,92,246,0.08),transparent_50%)]" />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
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
            {t('projects.backToDashboard')}
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {project.name}
              </h1>
              {project.description ? (
                <p className="mt-1.5 line-clamp-2 max-w-2xl text-sm text-gray-600">
                  {project.description}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                <span>
                  {boardCount === 1
                    ? t('projects.boardCountLabel', { count: boardCount })
                    : t('projects.boardCountLabelPlural', {
                        count: boardCount,
                      })}
                </span>
                <span>·</span>
                <span>
                  {memberCount === 1
                    ? t('projects.memberCountLabel', { count: memberCount })
                    : t('projects.memberCountLabelPlural', {
                        count: memberCount,
                      })}
                </span>
                <span>·</span>
                <span>{roleLabel}</span>
                <span>·</span>
                <span>
                  {t('projects.updatedAt', {
                    date: formatDate(project.updatedAt),
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
            </div>
          </div>

          <div className="mt-6">
            <ProjectSubNav />
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
