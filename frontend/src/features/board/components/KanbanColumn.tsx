'use client';

import { memo, type HTMLAttributes } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { BoardColumn, BoardTask } from '../types';
import type { ProjectMember } from '@/features/projects/types';
import type { CreateTaskInput } from '@/features/tasks/types';
import { columnSortableKey } from '../utils/applyRealtimeEvent';
import { getColumnTaskDropId } from '../utils/kanbanDndUtils';
import { useLocale } from '@/i18n/LocaleProvider';
import { SortableTaskCard } from './TaskCard';
import { AddTaskForm } from './AddTaskForm';
import { GripVerticalIcon } from './GripVerticalIcon';

interface KanbanColumnProps {
  column: BoardColumn;
  members: ProjectMember[];
  onTaskEdit: (task: BoardTask) => void;
  onTaskToggleComplete?: (task: BoardTask, completed: boolean) => void;
  onChecklistItemToggle?: (
    taskId: string,
    itemId: string,
    isDone: boolean,
  ) => void | Promise<void>;
  onTaskAttachmentClick?: (task: BoardTask) => void;
  onAddTask: (columnId: string, input: CreateTaskInput) => Promise<void>;
  onEdit?: (column: BoardColumn) => void;
  onDelete?: (column: BoardColumn) => void;
  canDelete?: boolean;
  canReorder?: boolean;
  canCreateTask?: boolean;
  canEditTask?: boolean;
  canToggleComplete?: boolean;
  canToggleChecklist?: boolean;
  canMoveTasks?: boolean;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  isDragOverlay?: boolean;
  highlightedTaskId?: string | null;
  variant?: 'default' | 'glass';
}

export const KanbanColumn = memo(function KanbanColumn({
  column,
  members,
  onTaskEdit,
  onTaskToggleComplete,
  onChecklistItemToggle,
  onTaskAttachmentClick,
  onAddTask,
  onEdit,
  onDelete,
  canDelete = false,
  canReorder = false,
  canCreateTask = false,
  canEditTask = false,
  canToggleComplete = false,
  canToggleChecklist = false,
  canMoveTasks = false,
  dragHandleProps,
  isDragOverlay = false,
  highlightedTaskId = null,
  variant = 'default',
}: KanbanColumnProps) {
  const { t } = useLocale();
  const { setNodeRef, isOver } = useDroppable({
    id: getColumnTaskDropId(column.id),
  });
  const tasks = column.tasks ?? [];
  const taskIds = tasks.map((t) => t.id);
  const sortableKey = columnSortableKey(column);
  const isGlass = variant === 'glass';

  const columnClass = isGlass
    ? isDragOverlay
      ? 'rotate-1 border-white/30 bg-white/20 shadow-2xl ring-2 ring-white/40 backdrop-blur-xl'
      : isOver
        ? 'border-white/40 bg-white/25 backdrop-blur-xl'
        : 'border-white/20 bg-white/10 backdrop-blur-xl'
    : isDragOverlay
      ? 'rotate-1 shadow-lg ring-2 ring-primary-200'
      : isOver
        ? 'border-primary-400 bg-primary-50/30'
        : 'border-gray-200';

  const bgClass = isGlass ? '' : 'bg-gray-50';

  return (
    <div
      className={`flex h-full max-h-full w-[calc(100dvw-2rem)] min-w-[calc(100dvw-2rem)] shrink-0 flex-col rounded-xl border transition sm:w-72 sm:min-w-0 ${bgClass} ${columnClass}`}
    >
      <div
        className="flex shrink-0 items-start gap-2 rounded-t-xl px-4 py-3"
        style={{ borderTop: `3px solid ${column.color ?? '#6B7280'}` }}
      >
        {canReorder && dragHandleProps && (
          <button
            type="button"
            className={`-ms-1 mt-0.5 shrink-0 cursor-grab touch-none rounded p-1.5 transition active:cursor-grabbing max-sm:p-2 sm:p-0.5 ${
              isGlass
                ? 'text-white/50 hover:bg-white/10 hover:text-white/80'
                : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600'
            }`}
            aria-label={t('board.reorderColumn', { name: column.name })}
            title={t('common.dragToReorder')}
            {...dragHandleProps}
          >
            <GripVerticalIcon className="h-4 w-4" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h3
            className={`font-medium ${isGlass ? 'text-white' : 'text-gray-900'}`}
          >
            {column.name}
            <span
              className={`ms-2 text-sm font-normal ${isGlass ? 'text-white/60' : 'text-gray-500'}`}
            >
              {tasks.length}
            </span>
          </h3>
        </div>
        {(onEdit || (canDelete && onDelete)) && (
          <div className="flex shrink-0 gap-0.5">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(column)}
                className={`rounded px-1.5 py-0.5 text-xs transition ${
                  isGlass
                    ? 'text-white/60 hover:bg-white/10 hover:text-white'
                    : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'
                }`}
                aria-label={t('board.editColumnNamed', { name: column.name })}
              >
                {t('common.edit')}
              </button>
            )}
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(column)}
                className={`rounded px-1.5 py-0.5 text-xs transition ${
                  isGlass
                    ? 'text-red-300 hover:bg-red-500/20'
                    : 'text-red-600 hover:bg-red-50'
                }`}
                aria-label={t('board.deleteColumnNamedAria', {
                  name: column.name,
                })}
              >
                {t('common.delete')}
              </button>
            )}
          </div>
        )}
      </div>

      {canCreateTask && (
        <div className="shrink-0 px-3 pb-1.5">
          <AddTaskForm
            members={members}
            onSubmit={(input) => onAddTask(column.id, input)}
          />
        </div>
      )}

      <div
        ref={setNodeRef}
        className={`kanban-column-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 ${
          isOver && tasks.length === 0
            ? isGlass
              ? 'bg-white/10'
              : 'bg-primary-50/40'
            : ''
        }`}
      >
        <SortableContext
          key={sortableKey}
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={`${task.id}-${task.position}`}
              task={task}
              isCompleted={Boolean(task.isCompleted)}
              onEdit={canEditTask ? onTaskEdit : undefined}
              onToggleComplete={
                canToggleComplete ? onTaskToggleComplete : undefined
              }
              onChecklistItemToggle={
                canToggleChecklist ? onChecklistItemToggle : undefined
              }
              onAttachmentClick={onTaskAttachmentClick}
              isHighlighted={highlightedTaskId === task.id}
              canEdit={canEditTask}
              canToggleComplete={canToggleComplete}
              canToggleChecklist={canToggleChecklist}
              canDrag={canMoveTasks}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div
            className={`pointer-events-none flex min-h-[120px] items-center justify-center rounded-lg border border-dashed px-3 py-6 text-center text-xs ${
              isGlass
                ? 'border-white/25 text-white/45'
                : 'border-gray-200 text-gray-400'
            } ${isOver ? (isGlass ? 'border-white/50 text-white/70' : 'border-primary-300 text-primary-500') : ''}`}
          >
            {t('board.dropTasksHere')}
          </div>
        )}
      </div>
    </div>
  );
});

interface SortableKanbanColumnProps extends Omit<
  KanbanColumnProps,
  'dragHandleProps' | 'isDragOverlay'
> {
  disabled?: boolean;
}

export const SortableKanbanColumn = memo(function SortableKanbanColumn({
  column,
  disabled = false,
  canReorder = false,
  ...props
}: SortableKanbanColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    disabled: disabled || !canReorder,
    data: { type: 'column' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      <KanbanColumn
        column={column}
        canReorder={canReorder}
        dragHandleProps={
          canReorder ? { ...attributes, ...listeners } : undefined
        }
        {...props}
      />
    </div>
  );
});
