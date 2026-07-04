'use client';

import { Button } from 'antd';
import type { BoardColumn, BoardTask } from '../types';
import type { ProjectMember } from '@/features/projects/types';
import { LabelBadges } from '@/features/labels/components/LabelBadges';
import { TaskComments } from '@/features/comments/components/TaskComments';
import { TaskAttachments } from '@/features/attachments/components/TaskAttachments';
import { normalizeTaskLabels } from '@/features/labels/types';
import { getTaskAssignees, priorityStyles } from '@/features/tasks/types';
import { formatDueDate, isDueDateOverdue } from '@/features/tasks/utils/dates';
import { AppModal } from '@/shared/components/ui/AppModal';
import { AssigneeDisplay } from './AssigneeDisplay';
import { TaskChecklistEditor } from './TaskChecklistEditor';

interface TaskViewModalProps {
  task: BoardTask;
  columns: BoardColumn[];
  members: ProjectMember[];
  onClose: () => void;
  onEdit?: () => void;
  onRefresh?: () => Promise<void>;
  canToggleChecklist?: boolean;
  canEditChecklist?: boolean;
}

export function TaskViewModal({
  task,
  columns,
  onClose,
  onEdit,
  onRefresh,
  canToggleChecklist = true,
  canEditChecklist = false,
}: TaskViewModalProps) {
  const style = priorityStyles[task.priority];
  const labels = normalizeTaskLabels(task.labels);
  const columnName =
    task.column?.name ??
    columns.find((column) => column.id === task.columnId)?.name ??
    '—';
  const checklistItems = task.checklistItems ?? [];

  return (
    <AppModal
      title={
        <div className="flex flex-wrap items-center gap-2">
          <span>{task.title}</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}
          >
            {style.label}
          </span>
        </div>
      }
      subtitle={`Column: ${columnName}`}
      onClose={onClose}
      width={672}
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          {onEdit && (
            <Button type="primary" onClick={onEdit}>
              Edit
            </Button>
          )}
        </>
      }
    >
      {task.description && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900">Description</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
            {task.description}
          </p>
        </div>
      )}

      <div className="mb-6 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <span className="font-medium text-gray-700">Assignees</span>
          <p className="mt-0.5 text-gray-600">
            {getTaskAssignees(task).length > 0 ? (
              <AssigneeDisplay task={task} />
            ) : (
              'Unassigned'
            )}
          </p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Due date</span>
          <p
            className={`mt-0.5 ${
              task.dueDate && isDueDateOverdue(task.dueDate)
                ? 'font-medium text-red-600'
                : 'text-gray-600'
            }`}
          >
            {task.dueDate ? formatDueDate(task.dueDate) : '—'}
          </p>
        </div>
      </div>

      {labels.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900">Labels</h3>
          <LabelBadges labels={labels} className="mt-2" />
        </div>
      )}

      <div className="mb-6">
        <TaskChecklistEditor
          taskId={task.id}
          items={checklistItems}
          onChange={onRefresh ?? (async () => {})}
          canToggle={canToggleChecklist}
          canEdit={canEditChecklist}
          canManage={false}
        />
      </div>

      <div className="space-y-6 border-t border-gray-100 pt-6">
        <TaskComments taskId={task.id} />
        <TaskAttachments taskId={task.id} />
      </div>
    </AppModal>
  );
}
