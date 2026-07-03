'use client';

import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { BoardColumn, BoardTask } from '../types';
import type { ProjectMember } from '@/features/projects/types';
import type { CreateTaskInput } from '@/features/tasks/types';
import type { TaskFilters } from '@/features/search/types';
import { isTaskFiltersActive } from '@/features/search/utils/taskFilters';
import { columnSortableKey } from '../utils/applyRealtimeEvent';
import { SortableTaskCard } from './TaskCard';
import { AddTaskForm } from './AddTaskForm';

interface KanbanColumnProps {
  column: BoardColumn;
  members: ProjectMember[];
  onTaskClick: (task: BoardTask) => void;
  onTaskAttachmentClick?: (task: BoardTask) => void;
  onAddTask: (columnId: string, input: CreateTaskInput) => Promise<void>;
  onEdit?: (column: BoardColumn) => void;
  onDelete?: (column: BoardColumn) => void;
  canDelete?: boolean;
  searchQuery?: string;
  filters?: TaskFilters;
  highlightedTaskId?: string | null;
  taskIsVisible?: (task: BoardTask) => boolean;
}

export const KanbanColumn = memo(function KanbanColumn({
  column,
  members,
  onTaskClick,
  onTaskAttachmentClick,
  onAddTask,
  onEdit,
  onDelete,
  canDelete = false,
  searchQuery = '',
  filters,
  highlightedTaskId = null,
  taskIsVisible,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const tasks = column.tasks ?? [];
  const hasViewFilter =
    searchQuery.trim().length > 0 || isTaskFiltersActive(filters);
  const visibleTasks = hasViewFilter
    ? tasks.filter((task) => taskIsVisible?.(task) ?? true)
    : tasks;
  const taskIds = tasks.map((t) => t.id);
  const sortableKey = columnSortableKey(column);

  return (
    <div
      className={`flex w-72 shrink-0 flex-col rounded-xl border bg-gray-50 transition ${
        isOver ? 'border-primary-400 bg-primary-50/30' : 'border-gray-200'
      }`}
    >
      <div
        className="flex items-start justify-between gap-2 rounded-t-xl px-4 py-3"
        style={{ borderTop: `3px solid ${column.color ?? '#6B7280'}` }}
      >
        <h3 className="font-medium text-gray-900">
          {column.name}
          <span className="ml-2 text-sm font-normal text-gray-500">
            {hasViewFilter
              ? `${visibleTasks.length}/${tasks.length}`
              : tasks.length}
          </span>
        </h3>
        {(onEdit || (canDelete && onDelete)) && (
          <div className="flex shrink-0 gap-0.5">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(column)}
                className="rounded px-1.5 py-0.5 text-xs text-gray-500 transition hover:bg-gray-200 hover:text-gray-900"
                aria-label={`Edit ${column.name}`}
              >
                Edit
              </button>
            )}
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(column)}
                className="rounded px-1.5 py-0.5 text-xs text-red-600 transition hover:bg-red-50"
                aria-label={`Delete ${column.name}`}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      <div
        ref={setNodeRef}
        className="flex min-h-[120px] flex-1 flex-col gap-2 p-3"
      >
        <SortableContext
          key={sortableKey}
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => {
            const matches = !hasViewFilter || (taskIsVisible?.(task) ?? true);
            return (
              <SortableTaskCard
                key={`${task.id}-${task.position}`}
                task={task}
                onClick={onTaskClick}
                onAttachmentClick={onTaskAttachmentClick}
                isDimmed={hasViewFilter && !matches}
                isHighlighted={highlightedTaskId === task.id}
              />
            );
          })}
        </SortableContext>

        <AddTaskForm
          members={members}
          onSubmit={(input) => onAddTask(column.id, input)}
        />
      </div>
    </div>
  );
});
