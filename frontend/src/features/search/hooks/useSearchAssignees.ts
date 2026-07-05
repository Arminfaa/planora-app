'use client';

import { useQuery } from '@tanstack/react-query';
import { searchService } from '../services/search.service';
import { queryKeys, STALE_TIME } from '@/lib/query-keys';

export function useSearchAssignees(enabled: boolean) {
  const query = useQuery({
    queryKey: queryKeys.search.assignees,
    queryFn: () => searchService.listAssignees(),
    enabled,
    staleTime: STALE_TIME.searchAssignees,
  });

  return {
    assignees: query.data ?? [],
    isLoading: query.isLoading,
  };
}
