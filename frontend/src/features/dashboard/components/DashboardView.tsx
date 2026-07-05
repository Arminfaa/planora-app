'use client';

import { useMemo, useState } from 'react';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { CreateProjectModal } from '@/features/dashboard/components/CreateProjectModal';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { StatsCard } from '@/features/dashboard/components/StatsCard';
import { computeDashboardStats } from '@/features/dashboard/utils/stats';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { Button } from '@/shared/components/ui/Button';
import { Pagination } from '@/shared/components/ui/Pagination';

function projectMatchesQuery(
  project: { name: string; description?: string | null },
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    project.name.toLowerCase().includes(normalized) ||
    (project.description ?? '').toLowerCase().includes(normalized)
  );
}

export function DashboardView() {
  const {
    projects,
    pagination,
    stats,
    isLoading,
    error,
    createProject,
    goToPage,
  } = useProjects();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dashboardStats = computeDashboardStats(projects, {
    totalProjects: pagination?.total,
    uniqueMemberCount: stats?.uniqueMemberCount,
  });

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => projectMatchesQuery(project, searchQuery)),
    [projects, searchQuery],
  );

  const hasSearch = searchQuery.trim().length > 0;

  const handleCreate = async (data: { name: string; description?: string }) => {
    await createProject(data);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="relative overflow-hidden border-b border-indigo-100/60 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(99,102,241,0.12),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(139,92,246,0.08),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
          <DashboardHeader
            projectCount={projects.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewProject={() => setShowCreateModal(true)}
          />

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatsCard
              label="Projects"
              value={dashboardStats.totalProjects}
              accent="blue"
              variant="glass"
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              }
            />
            <StatsCard
              label="Boards"
              value={dashboardStats.totalBoards}
              accent="green"
              variant="glass"
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
                  />
                </svg>
              }
            />
            <StatsCard
              label="Team Members"
              value={dashboardStats.totalMembers}
              accent="purple"
              variant="glass"
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              }
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Your projects
            </h2>
            {hasSearch && (
              <p className="mt-0.5 text-sm text-gray-500">
                {filteredProjects.length} of {projects.length} shown
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <p className="text-gray-600">No projects yet</p>
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              Create your first project
            </Button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <p className="text-gray-600">No projects match your search</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Clear search
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {pagination && !hasSearch && (
              <div className="mt-8">
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={goToPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {showCreateModal && (
        <CreateProjectModal
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
