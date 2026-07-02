import type { Project } from '@/features/projects/types';

export interface DashboardStats {
  totalProjects: number;
  totalBoards: number;
  totalMembers: number;
}

export function computeDashboardStats(projects: Project[]): DashboardStats {
  return {
    totalProjects: projects.length,
    totalBoards: projects.reduce((sum, p) => sum + (p._count?.boards ?? 0), 0),
    totalMembers: projects.reduce(
      (sum, p) => sum + (p._count?.members ?? 0),
      0,
    ),
  };
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}
