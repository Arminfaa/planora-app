'use client';

import { useCallback, useEffect, useState } from 'react';
import { labelService } from '../services/label.service';
import type { CreateLabelInput, ProjectLabel } from '../types';

export function useProjectLabels(projectId: string | null) {
  const [labels, setLabels] = useState<ProjectLabel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLabels = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError('');
    try {
      const data = await labelService.listByProject(projectId);
      setLabels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load labels');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchLabels();
  }, [fetchLabels]);

  const createLabel = useCallback(
    async (input: CreateLabelInput) => {
      if (!projectId) return null;
      const label = await labelService.create(projectId, input);
      await fetchLabels();
      return label;
    },
    [fetchLabels, projectId],
  );

  return {
    labels,
    isLoading,
    error,
    refetch: fetchLabels,
    createLabel,
  };
}
