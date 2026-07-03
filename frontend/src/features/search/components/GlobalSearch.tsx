'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearch } from '../hooks/useSearch';
import { priorityStyles } from '@/features/tasks/types';

export function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    hasQuery,
    isEmpty,
    clear,
  } = useSearch({ limit: 6 });

  const showPanel = isOpen && (hasQuery || isLoading);

  const close = useCallback(() => {
    setIsOpen(false);
    clear();
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
    projectId: string,
    boardId: string,
    taskId: string,
  ) => {
    close();
    router.push(
      `/dashboard/projects/${projectId}/boards/${boardId}?task=${taskId}`,
    );
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
          {isLoading && (
            <p className="px-4 py-3 text-sm text-gray-500">Searching...</p>
          )}

          {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}

          {isEmpty && (
            <p className="px-4 py-3 text-sm text-gray-500">No results found</p>
          )}

          {!isLoading && !error && taskItems.length > 0 && (
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
                            task.projectId,
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

          {!isLoading && !error && projectItems.length > 0 && (
            <div>
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Projects
              </p>
              <ul>
                {projectItems.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/dashboard/projects/${project.id}`}
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

          {hasQuery && !isLoading && !error && !isEmpty && (
            <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
              {results.tasks.pagination.total} tasks ·{' '}
              {results.projects.pagination.total} projects
            </p>
          )}
        </div>
      )}
    </div>
  );
}
