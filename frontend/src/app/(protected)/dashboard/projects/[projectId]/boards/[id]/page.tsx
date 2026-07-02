'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { boardService } from '@/features/board/services/board.service';
import type { Board } from '@/features/board/types';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { getApiErrorMessage } from '@/lib/api';

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export default function BoardPreviewPage() {
  const params = useParams<{ id: string; projectId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const data = await boardService.getById(params.id);
        setBoard(data);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };
    void fetchBoard();
  }, [params.id]);

  if (isLoading) return <LoadingSpinner />;

  if (error || !board) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || 'Board not found'}
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/dashboard/projects/${params.projectId}`}
        className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to Project
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
        <p className="mt-1 text-sm text-amber-600">
          Full Kanban board UI coming in Step 9
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.columns?.map((column) => (
          <div
            key={column.id}
            className="w-72 shrink-0 rounded-xl border border-gray-200 bg-gray-50"
          >
            <div
              className="rounded-t-xl px-4 py-3 font-medium text-gray-900"
              style={{
                borderTop: `3px solid ${column.color ?? '#6B7280'}`,
              }}
            >
              {column.name}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({column.tasks?.length ?? 0})
              </span>
            </div>
            <div className="space-y-2 p-3">
              {column.tasks?.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {task.title}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${priorityColors[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                    {task.assignee && (
                      <span className="text-xs text-gray-500">
                        {task.assignee.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {(!column.tasks || column.tasks.length === 0) && (
                <p className="py-4 text-center text-xs text-gray-400">
                  No tasks
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
