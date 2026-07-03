'use client';

import { useParams } from 'next/navigation';
import { KanbanBoard } from '@/features/board/components/KanbanBoard';
import { useBoard } from '@/features/board/hooks/useBoard';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';

export default function BoardPage() {
  const params = useParams<{ id: string; boardId: string }>();
  const { board, isLoading, error, refetch, revision } = useBoard(
    params.boardId,
  );

  if (isLoading) return <LoadingSpinner />;

  if (error || !board) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || 'Board not found'}
      </div>
    );
  }

  return (
    <KanbanBoard
      board={board}
      projectId={params.id}
      revision={revision}
      onRefresh={refetch}
    />
  );
}
