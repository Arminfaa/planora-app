'use client';

import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api';
import { projectService } from '../services/project.service';
import type { CreateProjectInput, Project } from '../types';
import type { PaginatedData } from '@/shared/types/api';

export function useProjects() {
  const [data, setData] = useState<PaginatedData<Project> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProjects = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await projectService.list(page);
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(
    async (input: CreateProjectInput) => {
      const project = await projectService.create(input);
      await fetchProjects();
      return project;
    },
    [fetchProjects],
  );

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  return {
    projects: data?.items ?? [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch: fetchProjects,
    createProject,
  };
}
