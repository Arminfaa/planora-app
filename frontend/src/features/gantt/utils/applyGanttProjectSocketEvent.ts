import type { QueryClient } from '@tanstack/react-query';
import type { ProjectSocketEvent } from '@/features/projects/types/socket';
import type { GanttDependency } from '../types';
import {
  addGanttDependencyToCache,
  removeGanttDependencyFromCache,
} from './patchGanttDependencyInCache';

export function applyGanttProjectSocketEvent(
  queryClient: QueryClient,
  projectId: string,
  event: ProjectSocketEvent,
): void {
  switch (event.type) {
    case 'task:dependency:created': {
      const { dependency } = event.payload as { dependency?: GanttDependency };
      if (dependency) {
        addGanttDependencyToCache(queryClient, projectId, dependency);
      }
      break;
    }
    case 'task:dependency:deleted': {
      const { dependencyId } = event.payload as { dependencyId?: string };
      if (dependencyId) {
        removeGanttDependencyFromCache(queryClient, projectId, dependencyId);
      }
      break;
    }
  }
}
