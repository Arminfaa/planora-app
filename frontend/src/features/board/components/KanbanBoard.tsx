'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Board, BoardTask } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { taskService } from '@/features/tasks/services/task.service';
import { getApiErrorMessage } from '@/lib/api';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';

const TaskModal = dynamic(
  () => import('./TaskModal').then((mod) => ({ default: mod.TaskModal })),
  { loading: () => <LoadingSpinner /> },
);

interface KanbanBoardProps {
  board: Board;
  projectId: string;
  onRefresh: () => Promise<void>;
}

export function KanbanBoard({ board, projectId, onRefresh }: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [actionError, setActionError] = useState('');

  const handleAddTask = useCallback(
    async (columnId: string, title: string) => {
      setActionError('');
      try {
        await taskService.create(columnId, { title });
        await onRefresh();
      } catch (err) {
        setActionError(getApiErrorMessage(err));
      }
    },
    [onRefresh],
  );

  const handleTaskUpdate = useCallback(async () => {
    await onRefresh();
    setSelectedTask(null);
  }, [onRefresh]);

  const handleTaskDelete = useCallback(async () => {
    await onRefresh();
    setSelectedTask(null);
  }, [onRefresh]);

  const columns = board.columns ?? [];
  const totalTasks = columns.reduce(
    (sum, col) => sum + (col.tasks?.length ?? 0),
    0,
  );

  return (
    <div>
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to Project
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {columns.length} columns · {totalTasks} tasks
          </p>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-6">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onTaskClick={setSelectedTask}
            onAddTask={handleAddTask}
          />
        ))}
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          columns={columns}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}
    </div>
  );
}
