import type { Project } from '@/features/projects/types';
import type { Locale } from '@/i18n/types';
import { formatLocaleDate } from '@/lib/jalali-dates';

export interface DashboardStats {
  totalProjects: number;
  totalBoards: number;
  totalMembers: number;
}

export function computeDashboardStats(
  projects: Project[],
  options?: { totalProjects?: number; uniqueMemberCount?: number },
): DashboardStats {
  return {
    totalProjects: options?.totalProjects ?? projects.length,
    totalBoards: projects.reduce((sum, p) => sum + (p._count?.boards ?? 0), 0),
    totalMembers: options?.uniqueMemberCount ?? 0,
  };
}

export function formatDate(date: string, locale: Locale = 'en'): string {
  return formatLocaleDate(date, locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
