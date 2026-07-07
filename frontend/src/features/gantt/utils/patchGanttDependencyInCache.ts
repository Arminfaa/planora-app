import type { QueryClient } from '@tanstack/react-query';
import type { GanttDependency, ProjectGanttData } from '../types';
import { queryKeys } from '@/lib/query-keys';

export function addGanttDependencyToCache(
  queryClient: QueryClient,
  projectIdOrSlug: string,
  dependency: GanttDependency,
): void {
  const ganttKey = queryKeys.projects.gantt(projectIdOrSlug);

  queryClient.setQueryData<ProjectGanttData>(ganttKey, (prev) => {
    if (!prev) return prev;

    const exists = prev.dependencies.some(
      (item) =>
        item.id === dependency.id ||
        (item.fromTaskId === dependency.fromTaskId &&
          item.toTaskId === dependency.toTaskId),
    );

    if (exists) return prev;

    return {
      ...prev,
      dependencies: [...prev.dependencies, dependency],
    };
  });
}

export function removeGanttDependencyFromCache(
  queryClient: QueryClient,
  projectIdOrSlug: string,
  dependencyId: string,
): void {
  const ganttKey = queryKeys.projects.gantt(projectIdOrSlug);

  queryClient.setQueryData<ProjectGanttData>(ganttKey, (prev) => {
    if (!prev) return prev;

    return {
      ...prev,
      dependencies: prev.dependencies.filter(
        (dependency) => dependency.id !== dependencyId,
      ),
    };
  });
}
