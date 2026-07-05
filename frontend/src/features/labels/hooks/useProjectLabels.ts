'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { labelService } from '../services/label.service';
import type { CreateLabelInput } from '../types';
import { queryKeys, STALE_TIME } from '@/lib/query-keys';

export function useProjectLabels(projectId: string | null) {
  const queryClient = useQueryClient();
  const labelsKey = queryKeys.projects.labels(projectId ?? '');

  const query = useQuery({
    queryKey: labelsKey,
    queryFn: () => labelService.listByProject(projectId!),
    enabled: Boolean(projectId),
    staleTime: STALE_TIME.labels,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateLabelInput) =>
      labelService.create(projectId!, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: labelsKey }),
  });

  const createLabel = async (input: CreateLabelInput) => {
    if (!projectId) return null;
    return createMutation.mutateAsync(input);
  };

  return {
    labels: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : '',
    refetch: query.refetch,
    createLabel,
  };
}
