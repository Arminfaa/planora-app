'use client';

import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { BoardColumn, BoardTask } from '../types';
import { SortableTaskCard } from './TaskCard';
import { AddTaskForm } from './AddTaskForm';

interface KanbanColumnProps {
  column: BoardColumn;
  onTaskClick: (task: BoardTask) => void;
  onAddTask: (columnId: string, title: string) => Promise<void>;
}

export const KanbanColumn = memo(function KanbanColumn({
  column,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const tasks = column.tasks ?? [];
  const taskIds = tasks.map((t) => t.id);

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
            {tasks.length}
          </span>
        </h3>
      </div>

      <div
        ref={setNodeRef}
        className="flex min-h-[120px] flex-1 flex-col gap-2 p-3"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>

        <AddTaskForm onSubmit={(title) => onAddTask(column.id, title)} />
      </div>
    </div>
  );
});
