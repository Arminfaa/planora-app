'use client';

import { memo } from 'react';
import type { BoardTask } from '../types';
import { priorityStyles } from '@/features/tasks/types';

interface TaskCardProps {
  task: BoardTask;
  onClick: (task: BoardTask) => void;
}

export const TaskCard = memo(function TaskCard({
  task,
  onClick,
}: TaskCardProps) {
  const style = priorityStyles[task.priority];

  return (
    <button
      type="button"
      onClick={() => onClick(task)}
      className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-primary-300 hover:shadow-md"
    >
      <p className="text-sm font-medium text-gray-900">{task.title}</p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
          {task.description}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between">
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${style.badge}`}
        >
          {style.label}
        </span>
        {task.assignee && (
          <span className="truncate text-xs text-gray-500">
            {task.assignee.name}
          </span>
        )}
      </div>
    </button>
  );
});
