'use client';

import { usePathname } from 'next/navigation';
import { AllTasksSkeleton } from '@/features/board/components/AllTasksSkeleton';
import { KanbanBoardSkeleton } from '@/features/board/components/KanbanBoardSkeleton';
import { GanttSkeleton } from '@/features/gantt/components/GanttSkeleton';
import { ProjectGroupSkeleton } from '@/features/projects/components/skeletons/ProjectGroupSkeleton';
import {
  ProjectOverviewSkeleton,
  ProjectShellSkeleton,
} from '@/features/projects/components/skeletons/ProjectOverviewSkeleton';
import { ProjectSettingsSkeleton } from '@/features/projects/components/skeletons/ProjectSettingsSkeleton';
import { ProjectTeamSkeleton } from '@/features/projects/components/skeletons/ProjectTeamSkeleton';

interface ProjectRouteSkeletonProps {
  /**
   * When false, only the page body is shown (for hub `loading.tsx`
   * inside ProjectLayoutShell). Default true for ProjectProvider.
   */
  includeShell?: boolean;
}

/**
 * Content-matched shell shown while project detail is loading.
 * Picks a skeleton from the current route so the layout does not jump.
 */
export function ProjectRouteSkeleton({
  includeShell = true,
}: ProjectRouteSkeletonProps) {
  const pathname = usePathname();
  const body = resolveBodySkeleton(pathname);

  if (!includeShell) {
    return body;
  }

  if (pathname.includes('/boards/') && pathname.endsWith('/tasks')) {
    return <AllTasksSkeleton scope="board" />;
  }

  if (pathname.includes('/boards/')) {
    return <KanbanBoardSkeleton />;
  }

  return <ProjectShellSkeleton>{body}</ProjectShellSkeleton>;
}

function resolveBodySkeleton(pathname: string) {
  if (pathname.includes('/boards/') && pathname.endsWith('/tasks')) {
    return <AllTasksSkeleton scope="board" />;
  }

  if (pathname.includes('/boards/')) {
    return <KanbanBoardSkeleton />;
  }

  if (pathname.endsWith('/team')) {
    return <ProjectTeamSkeleton />;
  }

  if (pathname.endsWith('/settings')) {
    return <ProjectSettingsSkeleton />;
  }

  if (pathname.endsWith('/gantt')) {
    return <GanttSkeleton />;
  }

  if (pathname.endsWith('/group')) {
    return <ProjectGroupSkeleton />;
  }

  if (pathname.endsWith('/tasks')) {
    return <AllTasksSkeleton scope="project" />;
  }

  return <ProjectOverviewSkeleton />;
}
