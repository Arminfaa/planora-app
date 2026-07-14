'use client';

import { useQueries } from '@tanstack/react-query';
import { queryKeys, STALE_TIME } from '@/lib/query-keys';
import { projectService } from '../services/project.service';
import type { PersonCompletionsStats } from '../types';

export function usePersonCompletionsMulti(
  projectId: string | null,
  userIds: string[],
  from: string,
  to: string,
  enabled = true,
) {
  const ready =
    Boolean(projectId) &&
    userIds.length > 0 &&
    Boolean(from) &&
    Boolean(to) &&
    enabled;

  const queries = useQueries({
    queries: userIds.map((userId) => ({
      queryKey: queryKeys.projects.personCompletions(
        projectId ?? '',
        userId,
        from,
        to,
      ),
      queryFn: () =>
        projectService.getPersonCompletions(projectId!, {
          userId,
          from,
          to,
        }),
      enabled: ready,
      staleTime: STALE_TIME.personCompletions,
    })),
  });

  const statsByUserId = new Map<string, PersonCompletionsStats>();
  for (let i = 0; i < userIds.length; i += 1) {
    const data = queries[i]?.data;
    if (data) statsByUserId.set(userIds[i], data);
  }

  const error = queries.find((query) => query.error)?.error ?? null;

  return {
    statsByUserId,
    isLoading: ready && queries.some((query) => query.isLoading),
    isFetching: queries.some((query) => query.isFetching),
    error,
    loadedCount: statsByUserId.size,
  };
}
