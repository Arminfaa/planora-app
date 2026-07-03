'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Board, BoardColumn, BoardTask } from '../types';
import { KanbanColumn, SortableKanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { CreateColumnForm } from './CreateColumnForm';
import { EditColumnModal } from './EditColumnModal';
import { useKanbanDnd } from '../hooks/useKanbanDnd';
import { useBoardSocket } from '../hooks/useBoardSocket';
import type { BoardSocketEvent } from '../types/socket';
import { columnService } from '../services/column.service';
import { taskService } from '@/features/tasks/services/task.service';
import type { CreateTaskInput } from '@/features/tasks/types';
import { useProjectMembers } from '@/features/projects/hooks/useProjectMembers';
import { getApiErrorMessage } from '@/lib/api';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { Button } from '@/shared/components/ui/Button';
import { BoardSearch } from '@/features/search/components/BoardSearch';
import { BoardFilters } from '@/features/search/components/BoardFilters';
import { defaultTaskFilters, type TaskFilters } from '@/features/search/types';
import {
  isTaskFiltersActive,
  taskIsVisible,
} from '@/features/search/utils/taskFilters';

const TaskAttachmentsPreviewModal = dynamic(
  () =>
    import('@/features/attachments/components/TaskAttachmentsPreviewModal').then(
      (mod) => ({ default: mod.TaskAttachmentsPreviewModal }),
    ),
  { loading: () => <LoadingSpinner /> },
);

const TaskModal = dynamic(
  () => import('./TaskModal').then((mod) => ({ default: mod.TaskModal })),
  { loading: () => <LoadingSpinner /> },
);

interface KanbanBoardProps {
  board: Board;
  projectId: string;
  projectSlug: string;
  revision: number;
  onRefresh: (options?: { silent?: boolean }) => Promise<void>;
  canDeleteColumns?: boolean;
  canReorderColumns?: boolean;
}

export function KanbanBoard({
  board,
  projectId,
  projectSlug,
  revision,
  onRefresh,
  canDeleteColumns = false,
  canReorderColumns = false,
}: KanbanBoardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTaskSlug = searchParams.get('task');
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [editingColumn, setEditingColumn] = useState<BoardColumn | null>(null);
  const [showCreateColumn, setShowCreateColumn] = useState(false);
  const [actionError, setActionError] = useState('');
  const [boardSearchQuery, setBoardSearchQuery] = useState('');
  const [boardFilters, setBoardFilters] =
    useState<TaskFilters>(defaultTaskFilters);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(
    null,
  );
  const [boardName, setBoardName] = useState(board.name);
  const [boardDeleted, setBoardDeleted] = useState(false);
  const [attachmentPreviewTask, setAttachmentPreviewTask] =
    useState<BoardTask | null>(null);

  useEffect(() => {
    setBoardName(board.name);
  }, [board.name]);

  const handleError = useCallback((message: string) => {
    setActionError(message);
  }, []);

  const {
    columns,
    activeTask,
    activeColumn,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    applyRemoteUpdate,
  } = useKanbanDnd(
    board.columns ?? [],
    board.id,
    revision,
    handleError,
    onRefresh,
  );

  useEffect(() => {
    if (!selectedTask) return;

    for (const column of columns) {
      const updated = column.tasks?.find((task) => task.id === selectedTask.id);
      if (updated) {
        setSelectedTask(updated);
        return;
      }
    }
    // Keep selected task in sync after silent board refresh (labels, etc.)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when columns data changes
  }, [columns, selectedTask?.id]);

  const handleRemoteChange = useCallback(
    (event: BoardSocketEvent) => {
      if (event.type === 'board:updated') {
        const { board: updated } = event.payload as {
          board?: { name?: string; slug?: string };
        };
        if (updated?.name) {
          setBoardName(updated.name);
        }
        if (updated?.slug && updated.slug !== board.slug) {
          const query = searchParams.toString();
          router.replace(
            `/dashboard/projects/${projectSlug}/boards/${updated.slug}${query ? `?${query}` : ''}`,
          );
        }
        return;
      }

      if (event.type === 'board:deleted') {
        setBoardDeleted(true);
        setActionError('This board was deleted by another user.');
        return;
      }

      if (event.type === 'column:created') {
        setShowCreateColumn(false);
      }

      if (event.type === 'column:deleted') {
        const { columnId } = event.payload as { columnId: string };
        setEditingColumn((prev) => (prev?.id === columnId ? null : prev));
      }

      applyRemoteUpdate(event);
    },
    [applyRemoteUpdate, board.slug, projectSlug, router, searchParams],
  );

  const { isConnected, isJoined, lastRemoteUpdate } = useBoardSocket(board.id, {
    onRemoteChange: handleRemoteChange,
  });

  const members = useProjectMembers(projectId);

  const handleAddTask = useCallback(
    async (columnId: string, input: CreateTaskInput) => {
      setActionError('');
      try {
        await taskService.create(columnId, input);
        await onRefresh();
      } catch (err) {
        setActionError(getApiErrorMessage(err));
      }
    },
    [onRefresh],
  );

  const handleCreateColumn = useCallback(
    async (input: { name: string; color?: string }) => {
      setActionError('');
      try {
        await columnService.create(board.id, {
          ...input,
          position: columns.length,
        });
        setShowCreateColumn(false);
        await onRefresh();
      } catch (err) {
        setActionError(getApiErrorMessage(err));
        throw err;
      }
    },
    [board.id, columns.length, onRefresh],
  );

  const handleUpdateColumn = useCallback(
    async (columnId: string, input: { name?: string; color?: string }) => {
      setActionError('');
      await columnService.update(columnId, input);
      await onRefresh();
    },
    [onRefresh],
  );

  const handleDeleteColumn = useCallback(
    async (column: BoardColumn) => {
      const taskCount = column.tasks?.length ?? 0;
      const message =
        taskCount > 0
          ? `Delete column "${column.name}"? ${taskCount} task(s) will be removed.`
          : `Delete column "${column.name}"?`;

      if (!confirm(message)) return;

      setActionError('');
      try {
        await columnService.delete(column.id);
        await onRefresh();
      } catch (err) {
        setActionError(getApiErrorMessage(err));
      }
    },
    [onRefresh],
  );

  const updateTaskQuery = useCallback(
    (taskSlug: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (taskSlug) {
        params.set('task', taskSlug);
      } else {
        params.delete('task');
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const closeTask = useCallback(() => {
    setSelectedTask(null);
    setHighlightedTaskId(null);
    updateTaskQuery(null);
  }, [updateTaskQuery]);

  const closeAttachmentPreview = useCallback(() => {
    setAttachmentPreviewTask(null);
  }, []);

  const openTask = useCallback(
    (task: BoardTask) => {
      setSelectedTask(task);
      setHighlightedTaskId(task.id);
      updateTaskQuery(task.slug);
    },
    [updateTaskQuery],
  );

  const openTaskAttachments = useCallback((task: BoardTask) => {
    setAttachmentPreviewTask(task);
    setHighlightedTaskId(task.id);
  }, []);

  const handleTaskUpdate = useCallback(async () => {
    await onRefresh({ silent: true });
  }, [onRefresh]);

  const handleTaskSave = useCallback(async () => {
    await onRefresh();
    closeTask();
  }, [closeTask, onRefresh]);

  const handleTaskDelete = useCallback(async () => {
    await onRefresh();
    closeTask();
  }, [closeTask, onRefresh]);

  const totalTasks = columns.reduce(
    (sum, col) => sum + (col.tasks?.length ?? 0),
    0,
  );

  const matchTask = useCallback(
    (task: BoardTask) => taskIsVisible(task, boardSearchQuery, boardFilters),
    [boardFilters, boardSearchQuery],
  );

  const hasActiveView =
    boardSearchQuery.trim().length > 0 || isTaskFiltersActive(boardFilters);

  const matchingTaskCount = useMemo(() => {
    if (!hasActiveView) return totalTasks;
    return columns.reduce(
      (sum, col) =>
        sum + (col.tasks?.filter((task) => matchTask(task)).length ?? 0),
      0,
    );
  }, [columns, hasActiveView, matchTask, totalTasks]);

  useEffect(() => {
    if (!activeTaskSlug) {
      setSelectedTask(null);
      setHighlightedTaskId(null);
      return;
    }

    const task = columns
      .flatMap((col) => col.tasks ?? [])
      .find((item) => item.slug === activeTaskSlug);

    if (task) {
      setSelectedTask(task);
      setHighlightedTaskId(task.id);
    }
  }, [activeTaskSlug, columns]);

  return (
    <div>
      <Link
        href={`/dashboard/projects/${projectSlug}`}
        className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to Project
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{boardName}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {columns.length} columns · {totalTasks} tasks
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Drag tasks to reorder or move between columns
            {canReorderColumns
              ? ' · Admins can reorder columns via the grip handle'
              : ''}
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

      <div className="mb-4 space-y-3">
        <BoardSearch
          value={boardSearchQuery}
          onChange={setBoardSearchQuery}
          matchCount={matchingTaskCount}
          totalCount={totalTasks}
          hasActiveView={hasActiveView}
        />
        <BoardFilters
          columns={columns}
          filters={boardFilters}
          onChange={setBoardFilters}
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          className={`flex gap-4 overflow-x-auto pb-6 ${boardDeleted ? 'pointer-events-none opacity-50' : ''}`}
        >
          <SortableContext
            items={columns.map((column) => column.id)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((column) => (
              <SortableKanbanColumn
                key={column.id}
                column={column}
                members={members}
                onTaskClick={openTask}
                onTaskAttachmentClick={openTaskAttachments}
                onAddTask={handleAddTask}
                onEdit={setEditingColumn}
                onDelete={handleDeleteColumn}
                canDelete={canDeleteColumns}
                canReorder={canReorderColumns}
                searchQuery={boardSearchQuery}
                filters={boardFilters}
                highlightedTaskId={highlightedTaskId}
                taskIsVisible={matchTask}
              />
            ))}
          </SortableContext>

          {showCreateColumn ? (
            <CreateColumnForm
              onSubmit={handleCreateColumn}
              onCancel={() => setShowCreateColumn(false)}
            />
          ) : (
            <div className="flex w-72 shrink-0 items-start pt-1">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateColumn(true)}
                className="w-full border-dashed"
              >
                + Add Column
              </Button>
            </div>
          )}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} onClick={() => {}} isDragOverlay />
          ) : null}
          {activeColumn ? (
            <KanbanColumn
              column={activeColumn}
              members={members}
              onTaskClick={() => {}}
              onAddTask={async () => {}}
              canReorder={canReorderColumns}
              isDragOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          columns={columns}
          members={members}
          projectId={projectId}
          onClose={closeTask}
          onRefresh={handleTaskUpdate}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
        />
      )}

      {attachmentPreviewTask && (
        <TaskAttachmentsPreviewModal
          task={attachmentPreviewTask}
          onClose={closeAttachmentPreview}
        />
      )}

      {editingColumn && (
        <EditColumnModal
          column={editingColumn}
          onClose={() => setEditingColumn(null)}
          onSubmit={handleUpdateColumn}
        />
      )}
    </div>
  );
}
