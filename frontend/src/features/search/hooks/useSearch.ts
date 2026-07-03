'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { searchService } from '../services/search.service';
import type { SearchParams, SearchResponse } from '../types';

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
}

export function useSearch({
  projectId,
  boardId,
  minLength = 2,
  limit = 8,
}: UseSearchOptions = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse>(emptyResults);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  const debouncedQuery = useDebounce(query.trim(), 300);

  const search = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < minLength) {
        setResults(emptyResults);
        setError('');
        setIsLoading(false);
        return;
      }

      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError('');

      const params: SearchParams = {
        q: searchQuery,
        page: 1,
        limit,
        projectId,
        boardId,
      };

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
    [boardId, limit, minLength, projectId],
  );

  useEffect(() => {
    void search(debouncedQuery);
  }, [debouncedQuery, search]);

  const clear = useCallback(() => {
    requestIdRef.current += 1;
    setQuery('');
    setResults(emptyResults);
    setError('');
    setIsLoading(false);
  }, []);

  const hasQuery = debouncedQuery.length >= minLength;
  const taskCount = results.tasks.pagination.total;
  const projectCount = results.projects.pagination.total;
  const isEmpty =
    hasQuery && !isLoading && !error && taskCount === 0 && projectCount === 0;

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    isLoading,
    error,
    hasQuery,
    isEmpty,
    clear,
  };
}
