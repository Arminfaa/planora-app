'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { KanbanBoard } from '@/features/board/components/KanbanBoard';
import { useBoard } from '@/features/board/hooks/useBoard';
import { projectService } from '@/features/projects/services/project.service';
import type { Project } from '@/features/projects/types';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';

export default function BoardPage() {
  const params = useParams<{ slug: string; boardSlug: string }>();
  const { board, isLoading, error, refetch, revision } = useBoard(
    params.slug,
    params.boardSlug,
  );
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await projectService.getBySlug(params.slug);
        setProject(data);
      } catch {
        setProject(null);
      }
    };
    void fetchProject();
  }, [params.slug]);

  if (isLoading) return <LoadingSpinner />;

  if (error || !board) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || 'Board not found'}
      </div>
    );
  }

  const canManageColumns =
    project?.currentUserRole === 'OWNER' ||
    project?.currentUserRole === 'ADMIN';

  return (
    <KanbanBoard
      board={board}
      projectId={project?.id ?? board.projectId}
      projectSlug={params.slug}
      revision={revision}
      onRefresh={refetch}
      canDeleteColumns={canManageColumns}
      canReorderColumns={canManageColumns}
    />
  );
}
