'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearch } from '../hooks/useSearch';
import {
  DUE_DATE_FILTER_OPTIONS,
  type ApiDueDateFilter,
  type SearchFilterParams,
} from '../types/filter';
import {
  PRIORITY_OPTIONS,
  priorityStyles,
  type TaskPriority,
} from '@/features/tasks/types';
import { togglePriorityFilter } from '../utils/taskFilters';
import { defaultTaskFilters } from '../types/filter';

export function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilterParams>({});

  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    hasCriteria,
    isEmpty,
    clear,
  } = useSearch({ limit: 6, filters });

  const showPanel = isOpen;

  const close = useCallback(() => {
    setIsOpen(false);
    clear();
    setFilters({});
  }, [clear]);

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

  const handleTaskSelect = (
    projectSlug: string,
    boardId: string,
    taskId: string,
  ) => {
    close();
    router.push(
      `/dashboard/projects/${projectSlug}/boards/${boardId}?task=${taskId}`,
    );
  };

  const handlePriorityToggle = (priority: TaskPriority) => {
    const current = filters.priority ?? [];
    const next = togglePriorityFilter(
      { ...defaultTaskFilters, priorities: current },
      priority,
    ).priorities;
    setFilters((prev) => ({
      ...prev,
      priority: next.length ? next : undefined,
    }));
  };

  const taskItems = results.tasks.items;
  const projectItems = results.projects.items;

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
          placeholder="Search tasks & projects..."
          className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          aria-label="Global search"
        />
      </div>

      {showPanel && (
        <div
          id="global-search-results"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          <div className="space-y-3 border-b border-gray-100 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Task filters
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_OPTIONS.map((priority) => {
                const selected = filters.priority?.includes(priority) ?? false;
                const style = priorityStyles[priority];
                return (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => handlePriorityToggle(priority)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
                      selected
                        ? style.badge
                        : 'border border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
            <select
              value={filters.due ?? ''}
              onChange={(event) => {
                const value = event.target.value as ApiDueDateFilter | '';
                setFilters((prev) => ({
                  ...prev,
                  due: value || undefined,
                }));
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All due dates</option>
              {DUE_DATE_FILTER_OPTIONS.filter(
                (item) => item.value !== 'all',
              ).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {!hasCriteria && (
            <p className="px-4 py-3 text-sm text-gray-500">
              Type to search or apply filters
            </p>
          )}

          {hasCriteria && isLoading && (
            <p className="px-4 py-3 text-sm text-gray-500">Searching...</p>
          )}

          {hasCriteria && error && (
            <p className="px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          {hasCriteria && isEmpty && (
            <p className="px-4 py-3 text-sm text-gray-500">No results found</p>
          )}

          {hasCriteria && !isLoading && !error && taskItems.length > 0 && (
            <div className="border-b border-gray-100">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Tasks
              </p>
              <ul>
                {taskItems.map((task) => {
                  const style = priorityStyles[task.priority];
                  return (
                    <li key={task.id}>
                      <button
                        type="button"
                        onClick={() =>
                          handleTaskSelect(
                            task.projectSlug,
                            task.boardId,
                            task.id,
                          )
                        }
                        className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition hover:bg-gray-50"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {task.title}
                        </span>
                        <span className="text-xs text-gray-500">
                          {task.projectName} · {task.boardName} ·{' '}
                          {task.columnName}
                        </span>
                        <span
                          className={`mt-1 inline-flex w-fit rounded px-1.5 py-0.5 text-[10px] font-medium ${style.badge}`}
                        >
                          {style.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {hasCriteria &&
            !isLoading &&
            !error &&
            query.trim().length >= 2 &&
            projectItems.length > 0 && (
              <div>
                <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Projects
                </p>
                <ul>
                  {projectItems.map((project) => (
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
              </div>
            )}

          {hasCriteria && !isLoading && !error && !isEmpty && (
            <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
              {results.tasks.pagination.total} tasks
              {query.trim().length >= 2 &&
                ` · ${results.projects.pagination.total} projects`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
