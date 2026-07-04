'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getApiErrorMessage } from '@/lib/api';
import { searchService } from '../services/search.service';
import type { SearchProjectResult } from '../types';

export function GlobalSearch() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 300);
  const [projects, setProjects] = useState<SearchProjectResult[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setProjects([]);
    setTotal(0);
    setError('');
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [close]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setProjects([]);
      setTotal(0);
      setError('');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError('');

    searchService
      .search({ q: debouncedQuery, page: 1, limit: 8 })
      .then((data) => {
        if (cancelled) return;
        setProjects(data.projects.items);
        setTotal(data.projects.pagination.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setProjects([]);
        setTotal(0);
        setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const showResults = isOpen && debouncedQuery.length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search projects..."
          className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          aria-label="Search projects"
        />
      </div>

      {showResults && (
        <div
          id="global-search-results"
          className="absolute z-50 mt-2 max-h-[min(70vh,24rem)] w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          {isLoading && (
            <p className="px-4 py-3 text-sm text-gray-500">Searching...</p>
          )}

          {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}

          {!isLoading && !error && projects.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-500">No projects found</p>
          )}

          {!isLoading && !error && projects.length > 0 && (
            <>
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Projects
              </p>
              <ul>
                {projects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/dashboard/projects/${project.slug}`}
                      onClick={close}
                      className="block px-4 py-2.5 transition hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {project.name}
                      </span>
                      {project.description && (
                        <span className="mt-0.5 block line-clamp-1 text-xs text-gray-500">
                          {project.description}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              {total > projects.length && (
                <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
                  Showing {projects.length} of {total} projects
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
