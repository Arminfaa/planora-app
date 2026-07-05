'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  type CollisionDetection,
  closestCorners,
  pointerWithin,
} from '@dnd-kit/core';
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
import { checklistService } from '@/features/tasks/services/checklist.service';
import type { CreateTaskInput } from '@/features/tasks/types';
import { useProjectMembers } from '@/features/projects/hooks/useProjectMembers';
import { getApiErrorMessage, isForbiddenError } from '@/lib/api';
import { AssetImage } from '@/shared/components/ui/AssetImage';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { Button } from '@/shared/components/ui/Button';

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

const kanbanCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  return closestCorners(args);
};

interface KanbanBoardProps {
  board: Board;
  projectId: string;
  projectSlug: string;
  revision: number;
  onRefresh: (options?: { silent?: boolean }) => Promise<void>;
  canDeleteColumns?: boolean;
  canReorderColumns?: boolean;
  canManageBackground?: boolean;
  canCreateColumns?: boolean;
  canEditColumns?: boolean;
  canCreateTasks?: boolean;
  canEditTasks?: boolean;
  canMoveTasks?: boolean;
  canViewTasks?: boolean;
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
  canCreateColumns = true,
  canEditColumns = false,
  canCreateTasks = false,
  canEditTasks = false,
  canMoveTasks = false,
  canViewTasks = true,
}: KanbanBoardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTaskSlug = searchParams.get('task');
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [editingColumn, setEditingColumn] = useState<BoardColumn | null>(null);
  const [showCreateColumn, setShowCreateColumn] = useState(false);
  const [actionError, setActionError] = useState('');
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
    if (message.toLowerCase().includes('permission')) return;
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
        if (!isForbiddenError(err)) {
          setActionError(getApiErrorMessage(err));
        }
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
        if (!isForbiddenError(err)) {
          setActionError(getApiErrorMessage(err));
        }
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
        if (!isForbiddenError(err)) {
          setActionError(getApiErrorMessage(err));
        }
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
      if (!canEditTasks) return;
      setSelectedTask(task);
      setHighlightedTaskId(task.id);
      updateTaskQuery(task.slug);
    },
    [canEditTasks, updateTaskQuery],
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

  const handleToggleComplete = useCallback(
    async (task: BoardTask, completed: boolean) => {
      if (Boolean(task.isCompleted) === completed) return;

      setActionError('');
      try {
        await taskService.update(task.id, { isCompleted: completed });
        await onRefresh({ silent: true });
      } catch (err) {
        if (!isForbiddenError(err)) {
          setActionError(getApiErrorMessage(err));
        }
      }
    },
    [onRefresh],
  );

  const handleChecklistItemToggle = useCallback(
    async (taskId: string, itemId: string, isDone: boolean) => {
      setActionError('');
      try {
        await checklistService.update(taskId, itemId, { isDone });
        await onRefresh({ silent: true });
      } catch (err) {
        if (!isForbiddenError(err)) {
          setActionError(getApiErrorMessage(err));
        }
        throw err;
      }
    },
    [onRefresh],
  );

  const totalTasks = columns.reduce(
    (sum, col) => sum + (col.tasks?.length ?? 0),
    0,
  );

  useEffect(() => {
    if (!activeTaskSlug) {
      setSelectedTask(null);
      setHighlightedTaskId(null);
      return;
    }

    if (!canEditTasks) {
      updateTaskQuery(null);
      return;
    }

    const task = columns
      .flatMap((col) => col.tasks ?? [])
      .find((item) => item.slug === activeTaskSlug);

    if (task) {
      setSelectedTask(task);
      setHighlightedTaskId(task.id);
    }
  }, [activeTaskSlug, canEditTasks, columns, updateTaskQuery]);

  const hasCustomBackground = Boolean(backgroundUrl);

  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] w-full flex-col px-4 sm:px-6">
      {/* Background layer */}
      <div className="pointer-events-none absolute inset-0">
        {hasCustomBackground ? (
          <>
            <div className="relative h-full w-full">
              <AssetImage
                src={backgroundUrl!}
                alt=""
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </div>
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
      <div className="relative flex flex-col">
        <div className="shrink-0 py-6">
          <BoardHeader
            boardName={boardName}
            boardId={board.id}
            projectSlug={projectSlug}
            boardSlug={board.slug}
            columnsCount={columns.length}
            totalTasks={totalTasks}
            backgroundUrl={backgroundUrl}
            onBackgroundChange={setBackgroundUrl}
            canManageBackground={canManageBackground}
            canViewTasks={canViewTasks}
            isConnected={isConnected}
            isJoined={isJoined}
            lastRemoteUpdate={lastRemoteUpdate}
          />

          {!canViewTasks && (
            <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/20 px-4 py-3 text-sm text-amber-50 backdrop-blur-sm">
              You can view this board, but you do not have permission to see
              tasks.
            </div>
          )}

          {actionError && (
            <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-100 backdrop-blur-sm">
              {actionError}
            </div>
          )}
        </div>

        <div className="kanban-board-scroll sticky top-16 z-10 mt-2 h-[calc(100dvh-1rem)] overflow-x-auto overflow-y-hidden pb-2 max-sm:-mx-4 max-sm:px-4">
          <DndContext
            sensors={sensors}
            collisionDetection={kanbanCollisionDetection}
            autoScroll={{
              threshold: { x: 0.12, y: 0.15 },
              acceleration: 12,
            }}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div
              className={`flex h-full gap-4 pb-4 ${boardDeleted ? 'pointer-events-none opacity-50' : ''}`}
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
                    onTaskEdit={openTask}
                    onTaskToggleComplete={handleToggleComplete}
                    onChecklistItemToggle={handleChecklistItemToggle}
                    onTaskAttachmentClick={openTaskAttachments}
                    onAddTask={handleAddTask}
                    onEdit={canEditColumns ? setEditingColumn : undefined}
                    onDelete={handleDeleteColumn}
                    canDelete={canDeleteColumns}
                    canReorder={canReorderColumns}
                    canCreateTask={canCreateTasks}
                    canEditTask={canEditTasks}
                    canToggleComplete={canEditTasks}
                    canToggleChecklist={canEditTasks}
                    canMoveTasks={canMoveTasks}
                    highlightedTaskId={highlightedTaskId}
                    variant="glass"
                  />
                ))}
              </SortableContext>

              {canCreateColumns &&
                (showCreateColumn ? (
                  <CreateColumnForm
                    onSubmit={handleCreateColumn}
                    onCancel={() => setShowCreateColumn(false)}
                    variant="glass"
                  />
                ) : (
                  <div className="flex w-[calc(100dvw-2rem)] min-w-[calc(100dvw-2rem)] shrink-0 items-start pt-1 sm:w-72 sm:min-w-0">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowCreateColumn(true)}
                      className="w-full border border-dashed border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
                    >
                      + Add Column
                    </Button>
                  </div>
                ))}
            </div>

            <DragOverlay>
              {activeTask ? (
                <TaskCard
                  task={activeTask}
                  isCompleted={Boolean(activeTask.isCompleted)}
                  isDragOverlay
                />
              ) : null}
              {activeColumn ? (
                <KanbanColumn
                  column={activeColumn}
                  members={members}
                  onTaskEdit={() => {}}
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

      {selectedTask && canEditTasks && (
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
