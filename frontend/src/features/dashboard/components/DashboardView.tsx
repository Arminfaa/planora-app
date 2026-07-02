'use client';

import { useState } from 'react';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { CreateProjectForm } from '@/features/dashboard/components/CreateProjectForm';
import { DashboardWelcome } from '@/features/dashboard/components/DashboardWelcome';
import { StatsCard } from '@/features/dashboard/components/StatsCard';
import { computeDashboardStats } from '@/features/dashboard/utils/stats';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { Button } from '@/shared/components/ui/Button';
import { Pagination } from '@/shared/components/ui/Pagination';

export function DashboardView() {
  const { projects, pagination, isLoading, error, createProject, refetch } =
    useProjects();
  const [showForm, setShowForm] = useState(false);

  const stats = computeDashboardStats(projects);

  const handleCreate = async (data: { name: string; description?: string }) => {
    await createProject(data);
    setShowForm(false);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <DashboardWelcome />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatsCard
          label="Projects"
          value={stats.totalProjects}
          accent="blue"
          icon={
            <svg
              className="h-6 w-6"
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
          value={stats.totalBoards}
          accent="green"
          icon={
            <svg
              className="h-6 w-6"
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
          value={stats.totalMembers}
          accent="purple"
          icon={
            <svg
              className="h-6 w-6"
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

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Your Projects</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Project'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8">
          <CreateProjectForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-gray-600">No projects yet.</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            Create your first project
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {pagination && (
            <div className="mt-8">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => void refetch(page)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
