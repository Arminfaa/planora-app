'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api';
import type { PaginatedData } from '@/shared/types/api';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { searchService } from '../services/search.service';
import type {
  SearchFilterParams,
  SearchParams,
  SearchProjectResult,
  SearchResponse,
  SearchTaskResult,
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

function mergePaginated<T extends { id: string }>(
  previous: PaginatedData<T>,
  next: PaginatedData<T>,
): PaginatedData<T> {
  const seen = new Set(previous.items.map((item) => item.id));
  const items = [...previous.items];

  for (const item of next.items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      items.push(item);
    }
  }

  return { items, pagination: next.pagination };
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  const debouncedQuery = useDebounce(query.trim(), 300);
  const filtersKey = JSON.stringify(filters ?? {});

  const runSearch = useCallback(
    async (searchQuery: string, page: number, append: boolean) => {
      const hasQuery = searchQuery.length >= minLength;
      const hasFilters = hasFilterCriteria(filters);

      if (!hasQuery && !hasFilters) {
        setResults(emptyResults);
        setError('');
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const requestId = ++requestIdRef.current;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError('');
      }

      const params: SearchParams = {
        page,
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

        setResults((prev) =>
          append
            ? {
                tasks: mergePaginated<SearchTaskResult>(prev.tasks, data.tasks),
                projects: mergePaginated<SearchProjectResult>(
                  prev.projects,
                  data.projects,
                ),
              }
            : data,
        );
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        if (!append) {
          setResults(emptyResults);
          setError(getApiErrorMessage(err));
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [boardId, filters, limit, minLength, projectId],
  );

  useEffect(() => {
    void runSearch(debouncedQuery, 1, false);
  }, [debouncedQuery, filtersKey, runSearch]);

  const loadMore = useCallback(() => {
    const nextPage = results.tasks.pagination.page + 1;
    void runSearch(debouncedQuery, nextPage, true);
  }, [debouncedQuery, results.tasks.pagination.page, runSearch]);

  const clear = useCallback(() => {
    requestIdRef.current += 1;
    setQuery('');
    setResults(emptyResults);
    setError('');
    setIsLoading(false);
    setIsLoadingMore(false);
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

  const hasMoreTasks =
    results.tasks.pagination.page < results.tasks.pagination.totalPages;
  const hasMoreProjects =
    debouncedQuery.length >= minLength &&
    results.projects.pagination.page < results.projects.pagination.totalPages;

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    isLoading,
    isLoadingMore,
    error,
    hasCriteria,
    isEmpty,
    hasMoreTasks,
    hasMoreProjects,
    loadMore,
    clear,
  };
}
