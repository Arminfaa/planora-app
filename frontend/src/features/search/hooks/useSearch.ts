'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { searchService } from '../services/search.service';
import type {
  SearchFilterParams,
  SearchParams,
  SearchResponse,
} from '../types';
import { toSearchFilterParams } from '../types';

const emptyResults: SearchResponse = {
  tasks: {
    items: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  },
  projects: {
    items: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  },
};

interface UseSearchOptions {
  projectId?: string;
  boardId?: string;
  minLength?: number;
  limit?: number;
  filters?: SearchFilterParams;
}

function hasFilterCriteria(filters?: SearchFilterParams): boolean {
  if (!filters) return false;
  return Boolean(filters.priority?.length || filters.assigneeId || filters.due);
}

export function useSearch({
  projectId,
  boardId,
  minLength = 2,
  limit = 8,
  filters,
}: UseSearchOptions = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse>(emptyResults);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  const debouncedQuery = useDebounce(query.trim(), 300);
  const filtersKey = JSON.stringify(filters ?? {});

  const runSearch = useCallback(
    async (searchQuery: string) => {
      const hasQuery = searchQuery.length >= minLength;
      const hasFilters = hasFilterCriteria(filters);

      if (!hasQuery && !hasFilters) {
        setResults(emptyResults);
        setError('');
        setIsLoading(false);
        return;
      }

      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError('');

      const params: SearchParams = {
        page: 1,
        limit,
        projectId,
        boardId,
        ...toSearchFilterParams(filters ?? {}),
      };

      if (hasQuery) {
        params.q = searchQuery;
      }

      try {
        const data = await searchService.search(params);
        if (requestId !== requestIdRef.current) return;
        setResults(data);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setResults(emptyResults);
        setError(getApiErrorMessage(err));
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [boardId, filters, limit, minLength, projectId],
  );

  useEffect(() => {
    void runSearch(debouncedQuery);
  }, [debouncedQuery, filtersKey, runSearch]);

  const clear = useCallback(() => {
    requestIdRef.current += 1;
    setQuery('');
    setResults(emptyResults);
    setError('');
    setIsLoading(false);
  }, []);

  const hasCriteria =
    debouncedQuery.length >= minLength || hasFilterCriteria(filters);
  const taskCount = results.tasks.pagination.total;
  const projectCount = results.projects.pagination.total;
  const isEmpty =
    hasCriteria &&
    !isLoading &&
    !error &&
    taskCount === 0 &&
    projectCount === 0;

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    isLoading,
    error,
    hasCriteria,
    isEmpty,
    clear,
  };
}
