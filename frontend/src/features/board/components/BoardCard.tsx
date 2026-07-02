import Link from 'next/link';
import type { Board } from '../types';

interface BoardCardProps {
  board: Board;
  projectId: string;
}

export function BoardCard({ board, projectId }: BoardCardProps) {
  const taskCount =
    board.columns?.reduce((sum, col) => sum + (col.tasks?.length ?? 0), 0) ?? 0;
  const columnCount = board.columns?.length ?? board._count?.columns ?? 0;

  return (
    <Link
      href={`/dashboard/projects/${projectId}/boards/${board.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary-300 hover:shadow-md"
    >
      <h3 className="font-semibold text-gray-900">{board.name}</h3>
      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <span>{columnCount} columns</span>
        <span>{taskCount} tasks</span>
      </div>
    </Link>
  );
}
