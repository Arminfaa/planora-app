'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/lib/api';
import { queryKeys, STALE_TIME } from '@/lib/query-keys';
import { projectService } from '../services/project.service';
import type { CreateProjectInput } from '../types';

export function useProjects(initialPage = 1, limit = 10) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(initialPage);

  const query = useQuery({
    queryKey: queryKeys.projects.list(page, limit),
    queryFn: () => projectService.list(page, limit),
    staleTime: STALE_TIME.projectsList,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateProjectInput) => projectService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });

  const createProject = async (input: CreateProjectInput) => {
    return createMutation.mutateAsync(input);
  };

  return {
    projects: query.data?.items ?? [],
    pagination: query.data?.pagination,
    stats: query.data?.stats,
    isLoading: query.isLoading,
    error: query.error ? getApiErrorMessage(query.error) : '',
    refetch: query.refetch,
    goToPage: setPage,
    createProject,
  };
}
