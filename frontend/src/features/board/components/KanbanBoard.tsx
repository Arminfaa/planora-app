'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
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
import { BoardHeader } from './BoardHeader';
import { useKanbanDnd } from '../hooks/useKanbanDnd';
import { useBoardSocket } from '../hooks/useBoardSocket';
import type { BoardSocketEvent } from '../types/socket';
import { columnService } from '../services/column.service';
import { taskService } from '@/features/tasks/services/task.service';
import type { CreateTaskInput } from '@/features/tasks/types';
import { useProjectMembers } from '@/features/projects/hooks/useProjectMembers';
import { getApiErrorMessage } from '@/lib/api';
import { getAssetUrl } from '@/lib/assets';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { Button } from '@/shared/components/ui/Button';
import { BoardFilterModal } from '@/features/search/components/BoardFilterModal';
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
  canManageBackground?: boolean;
}

export function KanbanBoard({
  board,
  projectId,
  projectSlug,
  revision,
  onRefresh,
  canDeleteColumns = false,
  canReorderColumns = false,
  canManageBackground = false,
}: KanbanBoardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTaskSlug = searchParams.get('task');
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [editingColumn, setEditingColumn] = useState<BoardColumn | null>(null);
  const [showCreateColumn, setShowCreateColumn] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [actionError, setActionError] = useState('');
  const [boardSearchQuery, setBoardSearchQuery] = useState('');
  const [boardFilters, setBoardFilters] =
    useState<TaskFilters>(defaultTaskFilters);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(
    null,
  );
  const [boardName, setBoardName] = useState(board.name);
  const [backgroundUrl, setBackgroundUrl] = useState(
    board.backgroundUrl ?? null,
  );
  const [boardDeleted, setBoardDeleted] = useState(false);
  const [attachmentPreviewTask, setAttachmentPreviewTask] =
    useState<BoardTask | null>(null);

  useEffect(() => {
    setBoardName(board.name);
  }, [board.name]);

  useEffect(() => {
    setBackgroundUrl(board.backgroundUrl ?? null);
  }, [board.backgroundUrl]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when columns data changes
  }, [columns, selectedTask?.id]);

  const handleRemoteChange = useCallback(
    (event: BoardSocketEvent) => {
      if (event.type === 'board:updated') {
        const { board: updated } = event.payload as {
          board?: {
            name?: string;
            slug?: string;
            backgroundUrl?: string | null;
          };
        };
        if (updated?.name) {
          setBoardName(updated.name);
        }
        if (updated?.backgroundUrl !== undefined) {
          setBackgroundUrl(updated.backgroundUrl);
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

  const hasCustomBackground = Boolean(backgroundUrl);

  return (
    <div className="relative flex min-h-[calc(100dvh-65px)] w-full flex-col overflow-hidden px-4">
      {/* Background layer */}
      <div className="pointer-events-none absolute inset-0">
        {hasCustomBackground ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getAssetUrl(backgroundUrl!)}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(99,102,241,0.35),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(139,92,246,0.25),transparent_50%)]" />
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </>
        )}
      </div>

      {/* Content */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-4 py-6">
          <BoardHeader
            boardName={boardName}
            boardId={board.id}
            projectSlug={projectSlug}
            columnsCount={columns.length}
            totalTasks={totalTasks}
            matchingTaskCount={matchingTaskCount}
            searchQuery={boardSearchQuery}
            onSearchChange={setBoardSearchQuery}
            filters={boardFilters}
            onOpenFilters={() => setShowFilterModal(true)}
            hasActiveView={hasActiveView}
            backgroundUrl={backgroundUrl}
            onBackgroundChange={setBackgroundUrl}
            canManageBackground={canManageBackground}
            isConnected={isConnected}
            isJoined={isJoined}
            lastRemoteUpdate={lastRemoteUpdate}
          />

          {actionError && (
            <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-100 backdrop-blur-sm">
              {actionError}
            </div>
          )}
        </div>

        <div className="mt-2 min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div
              className={`flex h-full min-h-[calc(100dvh-16rem)] gap-4 px-4 pb-4 ${boardDeleted ? 'pointer-events-none opacity-50' : ''}`}
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
                    variant="glass"
                  />
                ))}
              </SortableContext>

              {showCreateColumn ? (
                <CreateColumnForm
                  onSubmit={handleCreateColumn}
                  onCancel={() => setShowCreateColumn(false)}
                  variant="glass"
                />
              ) : (
                <div className="flex w-72 shrink-0 items-start pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateColumn(true)}
                    className="w-full border border-dashed border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
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
                  variant="glass"
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {showFilterModal && (
        <BoardFilterModal
          columns={columns}
          filters={boardFilters}
          onChange={setBoardFilters}
          onClose={() => setShowFilterModal(false)}
        />
      )}

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
