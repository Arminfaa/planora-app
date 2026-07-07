'use client';

import Link from 'next/link';
import type { Project } from '../types';
import { formatDate } from '@/features/dashboard/utils/stats';
import { useLocale } from '@/i18n/LocaleProvider';

const accentColors = [
  '#6366F1',
  '#8B5CF6',
  '#06B6D4',
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

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useLocale();
  const accent = getAccentColor(project.id);

  return (
    <Link
      href={`/dashboard/projects/${project.slug}`}
      className="group block overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm transition hover:border-primary-200 hover:shadow-md"
    >
      <div className="h-1" style={{ backgroundColor: accent }} />
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 transition group-hover:text-primary-700">
          {project.name}
        </h3>
        {project.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-gray-500">
            {project.description}
          </p>
        ) : (
          <p className="mt-2 text-sm text-gray-400">
            {t('projects.noDescription')}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
                />
              </svg>
              {t('projects.boardsCountShort', {
                count: project._count?.boards ?? 0,
              })}
            </span>
            <span className="inline-flex items-center gap-1">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              {t('projects.membersCountShort', {
                count: project._count?.members ?? 0,
              })}
            </span>
          </div>
          <span className="shrink-0 text-xs text-gray-400">
            {formatDate(project.updatedAt)}
          </span>
        </div>

        {project.owner && (
          <p className="mt-3 truncate text-xs text-gray-400">
            {t('projects.ownerDot', { name: project.owner.name })}
          </p>
        )}
      </div>
    </Link>
  );
}
