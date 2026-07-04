'use client';

import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage, isForbiddenError } from '@/lib/api';
import { projectService } from '../services/project.service';
import type { ProjectProgressStats } from '../types';

export function useProjectProgress(
  projectId: string | null,
  enabled = true,
  refetchKey?: number,
) {
  const [stats, setStats] = useState<ProjectProgressStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProgress = useCallback(async () => {
    if (!projectId || !enabled) {
      setStats(null);
      setError('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await projectService.getProgressStats(projectId);
      setStats(result);
    } catch (err) {
      if (!isForbiddenError(err)) {
        setError(getApiErrorMessage(err));
      }
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, projectId]);

  useEffect(() => {
    void fetchProgress();
  }, [fetchProgress, refetchKey]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchProgress,
  };
}
