'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import type { Board, BoardTask } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { useKanbanDnd } from '../hooks/useKanbanDnd';
import { useBoardSocket } from '../hooks/useBoardSocket';
import type { BoardSocketEvent } from '../types/socket';
import { taskService } from '@/features/tasks/services/task.service';
import { getApiErrorMessage } from '@/lib/api';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { BoardSearch } from '@/features/search/components/BoardSearch';
import { taskMatchesQuery } from '@/features/search/utils/matchTask';

const TaskModal = dynamic(
  () => import('./TaskModal').then((mod) => ({ default: mod.TaskModal })),
  { loading: () => <LoadingSpinner /> },
);

interface KanbanBoardProps {
  board: Board;
  projectId: string;
  revision: number;
  onRefresh: (options?: { silent?: boolean }) => Promise<void>;
  initialTaskId?: string | null;
}

export function KanbanBoard({
  board,
  projectId,
  revision,
  onRefresh,
  initialTaskId = null,
}: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [actionError, setActionError] = useState('');
  const [boardSearchQuery, setBoardSearchQuery] = useState('');
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(
    initialTaskId,
  );

  const handleError = useCallback((message: string) => {
    setActionError(message);
  }, []);

  const {
    columns,
    activeTask,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    applyRemoteUpdate,
  } = useKanbanDnd(board.columns ?? [], revision, handleError, onRefresh);

  const handleRemoteChange = useCallback(
    (event: BoardSocketEvent) => {
      applyRemoteUpdate(event);
    },
    [applyRemoteUpdate],
  );

  const { isConnected, isJoined, lastRemoteUpdate } = useBoardSocket(board.id, {
    onRemoteChange: handleRemoteChange,
  });

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

  const totalTasks = columns.reduce(
    (sum, col) => sum + (col.tasks?.length ?? 0),
    0,
  );

  const matchTask = useCallback(
    (task: BoardTask) => taskMatchesQuery(task, boardSearchQuery),
    [boardSearchQuery],
  );

  const matchingTaskCount = useMemo(() => {
    if (!boardSearchQuery.trim()) return totalTasks;
    return columns.reduce(
      (sum, col) =>
        sum + (col.tasks?.filter((task) => matchTask(task)).length ?? 0),
      0,
    );
  }, [boardSearchQuery, columns, matchTask, totalTasks]);

  useEffect(() => {
    if (!initialTaskId) return;

    const task = columns
      .flatMap((col) => col.tasks ?? [])
      .find((item) => item.id === initialTaskId);

    if (task) {
      setSelectedTask(task);
      setHighlightedTaskId(task.id);
    }
  }, [columns, initialTaskId]);

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
          <p className="mt-1 text-xs text-gray-400">
            Drag tasks to reorder or move between columns
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isConnected && isJoined
                ? 'bg-green-500'
                : isConnected
                  ? 'bg-amber-400'
                  : 'bg-gray-300'
            }`}
          />
          {isConnected && isJoined
            ? 'Live'
            : isConnected
              ? 'Joining...'
              : 'Connecting...'}
          {lastRemoteUpdate && (
            <span className="text-gray-400">
              · Updated {lastRemoteUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <BoardSearch
        value={boardSearchQuery}
        onChange={setBoardSearchQuery}
        matchCount={matchingTaskCount}
        totalCount={totalTasks}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-6">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onTaskClick={setSelectedTask}
              onAddTask={handleAddTask}
              searchQuery={boardSearchQuery}
              highlightedTaskId={highlightedTaskId}
              taskMatchesSearch={matchTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} onClick={() => {}} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

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
