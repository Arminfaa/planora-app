'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';

interface DashboardHeaderProps {
  projectCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNewProject: () => void;
}

export function DashboardHeader({
  projectCount,
  searchQuery,
  onSearchChange,
  onNewProject,
}: DashboardHeaderProps) {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const hasQuery = searchQuery.trim().length > 0;

  return (
    <header className="relative">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {projectCount} project{projectCount === 1 ? '' : 's'} · manage your
            workspaces
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:min-w-[240px] sm:flex-none">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-xl border border-gray-200 bg-white/80 py-2.5 pl-9 pr-8 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm backdrop-blur-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              aria-label="Search projects"
            />
            {hasQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onNewProject}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Project
          </button>
        </div>
      </div>
    </header>
  );
}
