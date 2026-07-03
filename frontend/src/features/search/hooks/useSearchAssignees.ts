'use client';

import { useEffect, useState } from 'react';
import { searchService } from '../services/search.service';
import type { SearchAssigneeOption } from '../types';

export function useSearchAssignees(enabled: boolean) {
  const [assignees, setAssignees] = useState<SearchAssigneeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setAssignees([]);
      return;
    }

    const fetchAssignees = async () => {
      setIsLoading(true);
      try {
        const data = await searchService.listAssignees();
        setAssignees(data);
      } catch {
        setAssignees([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAssignees();
  }, [enabled]);

  return { assignees, isLoading };
}
