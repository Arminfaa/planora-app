'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getApiErrorMessage } from '@/lib/api';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { searchService } from '../services/search.service';
import type { SearchProjectResult } from '../types';
import { useLocale } from '@/i18n/LocaleProvider';

export function GlobalSearch() {
  const { t } = useLocale();
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
      <SearchInput
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={t('dashboard.searchProjects')}
        aria-label={t('dashboard.searchProjects')}
        className="rounded-lg border-gray-300 bg-gray-50 shadow-sm focus-within:bg-white"
      />

      {showResults && (
        <div
          id="global-search-results"
          className="absolute z-50 mt-2 max-h-[min(70vh,24rem)] w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          {isLoading && (
            <p className="px-4 py-3 text-sm text-gray-500">
              {t('search.searching')}
            </p>
          )}

          {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}

          {!isLoading && !error && projects.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-500">
              {t('search.noProjectsFound')}
            </p>
          )}

          {!isLoading && !error && projects.length > 0 && (
            <>
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('dashboard.projects')}
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
                  {t('search.showingProjects', {
                    shown: projects.length,
                    total,
                  })}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
