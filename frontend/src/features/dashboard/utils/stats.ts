import type { Project } from '@/features/projects/types';

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

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}
