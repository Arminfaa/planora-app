'use client';

import { useQuery } from '@tanstack/react-query';
import { getApiErrorMessage, isForbiddenError } from '@/lib/api';
import { queryKeys, STALE_TIME } from '@/lib/query-keys';
import { projectService } from '../services/project.service';

export function useProjectProgress(projectId: string | null, enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.projects.progress(projectId ?? ''),
    queryFn: () => projectService.getProgressStats(projectId!),
    enabled: Boolean(projectId && enabled),
    staleTime: STALE_TIME.progress,
  });

  const error =
    query.error && !isForbiddenError(query.error)
      ? getApiErrorMessage(query.error)
      : '';

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    error,
    refetch: query.refetch,
  };
}
