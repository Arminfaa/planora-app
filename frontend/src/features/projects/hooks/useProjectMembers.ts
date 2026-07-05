'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, STALE_TIME } from '@/lib/query-keys';
import { projectService } from '../services/project.service';

export function useProjectMembers(projectId: string | null) {
  const query = useQuery({
    queryKey: queryKeys.projects.members(projectId ?? ''),
    queryFn: () => projectService.listMembers(projectId!),
    enabled: Boolean(projectId),
    staleTime: STALE_TIME.members,
  });

  return query.data ?? [];
}
