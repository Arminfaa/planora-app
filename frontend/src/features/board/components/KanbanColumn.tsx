'use client';

import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { BoardColumn, BoardTask } from '../types';
import { columnSortableKey } from '../utils/applyRealtimeEvent';
import { SortableTaskCard } from './TaskCard';
import { AddTaskForm } from './AddTaskForm';

interface KanbanColumnProps {
  column: BoardColumn;
  onTaskClick: (task: BoardTask) => void;
  onAddTask: (columnId: string, title: string) => Promise<void>;
  searchQuery?: string;
  highlightedTaskId?: string | null;
  taskMatchesSearch?: (task: BoardTask) => boolean;
}

export const KanbanColumn = memo(function KanbanColumn({
  column,
  onTaskClick,
  onAddTask,
  searchQuery = '',
  highlightedTaskId = null,
  taskMatchesSearch,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const tasks = column.tasks ?? [];
  const hasSearch = searchQuery.trim().length > 0;
  const visibleTasks = hasSearch
    ? tasks.filter((task) => taskMatchesSearch?.(task) ?? true)
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
        className="rounded-t-xl px-4 py-3"
        style={{ borderTop: `3px solid ${column.color ?? '#6B7280'}` }}
      >
        <h3 className="font-medium text-gray-900">
          {column.name}
          <span className="ml-2 text-sm font-normal text-gray-500">
            {hasSearch
              ? `${visibleTasks.length}/${tasks.length}`
              : tasks.length}
          </span>
        </h3>
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
            const matches = !hasSearch || (taskMatchesSearch?.(task) ?? true);
            return (
              <SortableTaskCard
                key={`${task.id}-${task.position}`}
                task={task}
                onClick={onTaskClick}
                isDimmed={hasSearch && !matches}
                isHighlighted={highlightedTaskId === task.id}
              />
            );
          })}
        </SortableContext>

        <AddTaskForm onSubmit={(title) => onAddTask(column.id, title)} />
      </div>
    </div>
  );
});
