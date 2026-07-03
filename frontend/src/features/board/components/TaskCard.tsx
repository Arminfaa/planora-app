'use client';

import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BoardTask } from '../types';
import { priorityStyles } from '@/features/tasks/types';
import { LabelBadges } from '@/features/labels/components/LabelBadges';
import { normalizeTaskLabels } from '@/features/labels/types';
import { formatDueDate, isDueDateOverdue } from '@/features/tasks/utils/dates';
import { getTaskAttachmentCount } from '../utils/taskMeta';
import { PaperclipIcon } from './PaperclipIcon';

interface TaskCardProps {
  task: BoardTask;
  onClick: (task: BoardTask) => void;
  onAttachmentClick?: (task: BoardTask) => void;
  isDragOverlay?: boolean;
  isDimmed?: boolean;
  isHighlighted?: boolean;
}

export const TaskCard = memo(function TaskCard({
  task,
  onClick,
  onAttachmentClick,
  isDragOverlay = false,
  isDimmed = false,
  isHighlighted = false,
}: TaskCardProps) {
  const style = priorityStyles[task.priority];
  const labels = normalizeTaskLabels(task.labels);
  const attachmentCount = getTaskAttachmentCount(task);

  return (
    <div
      className={`relative w-full rounded-lg border bg-white shadow-sm transition hover:border-primary-300 hover:shadow-md ${
        isDragOverlay ? 'rotate-2 shadow-lg ring-2 ring-primary-200' : ''
      } ${isDimmed ? 'opacity-35' : ''} ${
        isHighlighted
          ? 'border-primary-400 ring-2 ring-primary-100'
          : 'border-gray-200'
      }`}
    >
      {attachmentCount > 0 && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAttachmentClick?.(task);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-md bg-white/90 px-1.5 py-1 text-gray-600 shadow-sm ring-1 ring-gray-200 hover:bg-primary-50 hover:text-primary-600"
          aria-label={`View ${attachmentCount} attachment${attachmentCount === 1 ? '' : 's'}`}
          title={`${attachmentCount} attachment${attachmentCount === 1 ? '' : 's'}`}
        >
          <PaperclipIcon className="h-3.5 w-3.5" />
          {attachmentCount > 1 && (
            <span className="text-[10px] font-semibold leading-none">
              {attachmentCount}
            </span>
          )}
        </button>
      )}

      <button
        type="button"
        onClick={() => onClick(task)}
        className={`w-full p-3 text-left ${attachmentCount > 0 ? 'pr-10' : ''}`}
      >
        <p className="text-sm font-medium text-gray-900">{task.title}</p>
        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">
            {task.description}
          </p>
        )}
        <LabelBadges labels={labels} className="mt-2" />
        <div className="mt-3 flex items-center justify-between gap-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${style.badge}`}
          >
            {style.label}
          </span>
          <div className="flex min-w-0 flex-col items-end gap-0.5">
            {task.dueDate && (
              <span
                className={`text-xs ${
                  isDueDateOverdue(task.dueDate)
                    ? 'font-medium text-red-600'
                    : 'text-gray-500'
                }`}
              >
                {formatDueDate(task.dueDate)}
              </span>
            )}
            {task.assignee && (
              <span className="truncate text-xs text-gray-500">
                {task.assignee.name}
              </span>
            )}
          </div>
        </div>
      </button>
    </div>
  );
});

interface SortableTaskCardProps {
  task: BoardTask;
  onClick: (task: BoardTask) => void;
  onAttachmentClick?: (task: BoardTask) => void;
  isDimmed?: boolean;
  isHighlighted?: boolean;
}

export const SortableTaskCard = memo(function SortableTaskCard({
  task,
  onClick,
  onAttachmentClick,
  isDimmed = false,
  isHighlighted = false,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', columnId: task.columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onClick={onClick}
        onAttachmentClick={onAttachmentClick}
        isDimmed={isDimmed}
        isHighlighted={isHighlighted}
      />
    </div>
  );
});
