'use client';

import { memo } from 'react';
import type { BoardColumn, BoardTask } from '../types';
import { TaskCard } from './TaskCard';
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
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl border border-gray-200 bg-gray-50">
      <div
        className="rounded-t-xl px-4 py-3"
        style={{ borderTop: `3px solid ${column.color ?? '#6B7280'}` }}
      >
        <h3 className="font-medium text-gray-900">
          {column.name}
          <span className="ml-2 text-sm font-normal text-gray-500">
            {column.tasks?.length ?? 0}
          </span>
        </h3>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {column.tasks?.map((task) => (
          <TaskCard key={task.id} task={task} onClick={onTaskClick} />
        ))}

        <AddTaskForm onSubmit={(title) => onAddTask(column.id, title)} />
      </div>
    </div>
  );
});
