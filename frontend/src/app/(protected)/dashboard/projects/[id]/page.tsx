'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BoardCard } from '@/features/board/components/BoardCard';
import { useBoards } from '@/features/board/hooks/useBoards';
import { formatDate } from '@/features/dashboard/utils/stats';
import { projectService } from '@/features/projects/services/project.service';
import type { Project } from '@/features/projects/types';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { getApiErrorMessage } from '@/lib/api';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState('');
  const [loadingProject, setLoadingProject] = useState(true);
  const {
    boards,
    isLoading: loadingBoards,
    error: boardsError,
  } = useBoards(projectId);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await projectService.getById(projectId);
        setProject(data);
      } catch (err) {
        setProjectError(getApiErrorMessage(err));
      } finally {
        setLoadingProject(false);
      }
    };
    void fetchProject();
  }, [projectId]);

  if (loadingProject) return <LoadingSpinner />;

  if (projectError || !project) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {projectError || 'Project not found'}
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to Dashboard
      </Link>

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        {project.description && (
          <p className="mt-2 text-gray-600">{project.description}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
          <span>Slug: {project.slug}</span>
          <span>Updated: {formatDate(project.updatedAt)}</span>
          {project.owner && <span>Owner: {project.owner.name}</span>}
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-gray-900">Boards</h2>

      {boardsError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {boardsError}
        </div>
      )}

      {loadingBoards ? (
        <LoadingSpinner />
      ) : boards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-gray-600">
          No boards in this project yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} projectId={project.id} />
          ))}
        </div>
      )}
    </div>
  );
}
