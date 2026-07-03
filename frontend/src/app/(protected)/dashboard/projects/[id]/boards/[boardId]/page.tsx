'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { KanbanBoard } from '@/features/board/components/KanbanBoard';
import { useBoard } from '@/features/board/hooks/useBoard';
import { projectService } from '@/features/projects/services/project.service';
import type { Project } from '@/features/projects/types';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';

export default function BoardPage() {
  const params = useParams<{ id: string; boardId: string }>();
  const searchParams = useSearchParams();
  const taskId = searchParams.get('task');
  const { board, isLoading, error, refetch, revision } = useBoard(
    params.boardId,
  );
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await projectService.getById(params.id);
        setProject(data);
      } catch {
        setProject(null);
      }
    };
    void fetchProject();
  }, [params.id]);

  if (isLoading) return <LoadingSpinner />;

  if (error || !board) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || 'Board not found'}
      </div>
    );
  }

  const canDeleteColumns =
    project?.currentUserRole === 'OWNER' ||
    project?.currentUserRole === 'ADMIN';

  return (
    <KanbanBoard
      board={board}
      projectId={params.id}
      revision={revision}
      onRefresh={refetch}
      initialTaskId={taskId}
      canDeleteColumns={canDeleteColumns}
    />
  );
}
