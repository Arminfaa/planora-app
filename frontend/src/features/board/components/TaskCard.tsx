'use client';

import { Checkbox } from 'antd';
import { memo, type HTMLAttributes } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BoardTask } from '../types';
import { getPriorityStyles } from '@/features/tasks/types';
import { useLocale } from '@/i18n/LocaleProvider';
import { LabelBadges } from '@/features/labels/components/LabelBadges';
import { normalizeTaskLabels } from '@/features/labels/types';
import { formatDueDate, isDueDateOverdue } from '@/features/tasks/utils/dates';
import {
  getTaskAssigneeCardPresentation,
  type AssigneeColorTheme,
} from '@/features/tasks/utils/assigneeColors';
import { getTaskAttachmentCount } from '../utils/taskMeta';
import { PaperclipIcon } from './PaperclipIcon';
import { EditIcon } from './EditIcon';
import { GripVerticalIcon } from './GripVerticalIcon';
import { TaskChecklistPreview } from './TaskChecklistPreview';
import { AssigneeDisplay } from './AssigneeDisplay';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';

interface TaskCardProps {
  task: BoardTask;
  isCompleted?: boolean;
  onEdit?: (task: BoardTask) => void;
  onToggleComplete?: (task: BoardTask, completed: boolean) => void;
  onChecklistItemToggle?: (
    taskId: string,
    itemId: string,
    isDone: boolean,
  ) => void | Promise<void>;
  onAttachmentClick?: (task: BoardTask) => void;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  isDragOverlay?: boolean;
  isDimmed?: boolean;
  isHighlighted?: boolean;
  canEdit?: boolean;
  canToggleComplete?: boolean;
  canToggleChecklist?: boolean;
  memberColorMap?: Map<string, AssigneeColorTheme>;
}

export const TaskCard = memo(function TaskCard({
  task,
  isCompleted = false,
  onEdit,
  onToggleComplete,
  onChecklistItemToggle,
  onAttachmentClick,
  dragHandleProps,
  isDragOverlay = false,
  isDimmed = false,
  isHighlighted = false,
  canEdit = false,
  canToggleComplete = false,
  canToggleChecklist = false,
  memberColorMap,
}: TaskCardProps) {
  const { t, locale } = useLocale();
  const style = getPriorityStyles(t)[task.priority];
  const labels = normalizeTaskLabels(task.labels);
  const attachmentCount = getTaskAttachmentCount(task);
  const cardPresentation = memberColorMap
    ? getTaskAssigneeCardPresentation(task, memberColorMap, {
        isCompleted,
        isHighlighted,
        isDragOverlay,
        isDimmed,
      })
    : null;

  const stopCardPointer = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      className={
        cardPresentation?.className ??
        `cursor-default w-full rounded-lg border bg-white shadow-sm transition ${
          isDragOverlay ? 'rotate-2 shadow-lg ring-2 ring-primary-200' : ''
        } ${isDimmed ? 'opacity-35' : ''} ${
          isHighlighted
            ? 'border-primary-400 ring-2 ring-primary-100'
            : 'border-gray-200'
        } ${isCompleted ? 'bg-green-100/70' : ''}`
      }
      style={cardPresentation?.style}
    >
      <div className="p-3">
        <div className="flex items-start gap-1.5 sm:gap-2">
          {dragHandleProps && (
            <button
              type="button"
              className="-ms-0.5 mt-0.5 shrink-0 cursor-grab touch-none rounded p-1.5 text-gray-400 transition active:cursor-grabbing hover:bg-gray-100 hover:text-gray-600"
              aria-label={`Drag ${task.title}`}
              title={t('common.holdToDrag')}
              {...dragHandleProps}
            >
              <GripVerticalIcon className="h-4 w-4" />
            </button>
          )}

          <div
            className="shrink-0 pt-0.5"
            onClick={stopCardPointer}
            onPointerDown={stopCardPointer}
          >
            <Checkbox
              checked={isCompleted}
              disabled={!canToggleComplete}
              onChange={(event) =>
                onToggleComplete?.(task, event.target.checked)
              }
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p
                className={`text-sm font-medium ${
                  isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                }`}
              >
                {task.title}
              </p>
              <div className="flex shrink-0 items-center gap-0.5">
                {attachmentCount > 0 && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onAttachmentClick?.(task);
                    }}
                    onPointerDown={stopCardPointer}
                    className="flex items-center gap-0.5 rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-primary-600"
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
                {canEdit && onEdit && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(task);
                    }}
                    onPointerDown={stopCardPointer}
                    className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-primary-600"
                    aria-label={`Edit ${task.title}`}
                    title={t('board.editTask')}
                  >
                    <EditIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {task.description && (
              <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                {task.description}
              </p>
            )}

            <LabelBadges labels={labels} className="mt-2" />

            <TaskChecklistPreview
              items={task.checklistItems}
              interactive={canToggleChecklist}
              onToggleItem={
                canToggleChecklist && onChecklistItemToggle
                  ? (itemId, isDone) =>
                      onChecklistItemToggle(task.id, itemId, isDone)
                  : undefined
              }
            />

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
                    {formatDueDate(task.dueDate, locale)}
                  </span>
                )}
                <AssigneeDisplay
                  task={task}
                  memberColorMap={memberColorMap}
                  className="text-xs text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

interface SortableTaskCardProps {
  task: BoardTask;
  isCompleted?: boolean;
  onEdit?: (task: BoardTask) => void;
  onToggleComplete?: (task: BoardTask, completed: boolean) => void;
  onChecklistItemToggle?: (
    taskId: string,
    itemId: string,
    isDone: boolean,
  ) => void | Promise<void>;
  onAttachmentClick?: (task: BoardTask) => void;
  isDimmed?: boolean;
  isHighlighted?: boolean;
  canEdit?: boolean;
  canToggleComplete?: boolean;
  canToggleChecklist?: boolean;
  canDrag?: boolean;
  memberColorMap?: Map<string, AssigneeColorTheme>;
}

export const SortableTaskCard = memo(function SortableTaskCard({
  task,
  isCompleted = false,
  onEdit,
  onToggleComplete,
  onChecklistItemToggle,
  onAttachmentClick,
  isDimmed = false,
  isHighlighted = false,
  canEdit = false,
  canToggleComplete = false,
  canToggleChecklist = false,
  canDrag = true,
  memberColorMap,
}: SortableTaskCardProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !canDrag,
    data: { type: 'task', columnId: task.columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canDrag ? attributes : {})}
      {...(canDrag && !isMobile ? listeners : {})}
    >
      <TaskCard
        task={task}
        isCompleted={isCompleted}
        onEdit={onEdit}
        onToggleComplete={onToggleComplete}
        onChecklistItemToggle={onChecklistItemToggle}
        onAttachmentClick={onAttachmentClick}
        dragHandleProps={canDrag && isMobile ? listeners : undefined}
        isDimmed={isDimmed}
        isHighlighted={isHighlighted}
        canEdit={canEdit}
        canToggleComplete={canToggleComplete}
        canToggleChecklist={canToggleChecklist}
        memberColorMap={memberColorMap}
      />
    </div>
  );
});
