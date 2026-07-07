'use client';

import { useQuery } from '@tanstack/react-query';
import { ganttService } from '../services/gantt.service';
import { queryKeys, STALE_TIME } from '@/lib/query-keys';

export function useProjectGantt(
  projectIdOrSlug: string | null,
  enabled = true,
) {
  const query = useQuery({
    queryKey: queryKeys.projects.gantt(projectIdOrSlug ?? ''),
    queryFn: () => ganttService.getByProject(projectIdOrSlug!),
    enabled: Boolean(projectIdOrSlug && enabled),
    staleTime: STALE_TIME.gantt,
  });

  return {
    data: query.data ?? { scheduled: [], unscheduled: [], dependencies: [] },
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
