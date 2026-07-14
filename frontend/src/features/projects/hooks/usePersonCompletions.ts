'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, STALE_TIME } from '@/lib/query-keys';
import { projectService } from '../services/project.service';

export function usePersonCompletions(
  projectId: string | null,
  params: { userId: string; from: string; to: string } | null,
  enabled = true,
) {
  const ready =
    Boolean(projectId) &&
    Boolean(params?.userId) &&
    Boolean(params?.from) &&
    Boolean(params?.to) &&
    enabled;

  const query = useQuery({
    queryKey: queryKeys.projects.personCompletions(
      projectId ?? '',
      params?.userId ?? '',
      params?.from ?? '',
      params?.to ?? '',
    ),
    queryFn: () => projectService.getPersonCompletions(projectId!, params!),
    enabled: ready,
    staleTime: STALE_TIME.personCompletions,
  });

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
