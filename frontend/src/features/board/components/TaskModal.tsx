'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Button } from 'antd';
import type { BoardColumn, BoardTask } from '../types';
import type { ProjectMember } from '@/features/projects/types';
import { LabelBadges } from '@/features/labels/components/LabelBadges';
import { TaskLabelPicker } from '@/features/labels/components/TaskLabelPicker';
import { TaskComments } from '@/features/comments/components/TaskComments';
import { TaskAttachments } from '@/features/attachments/components/TaskAttachments';
import { useProjectLabels } from '@/features/labels/hooks/useProjectLabels';
import { normalizeTaskLabels } from '@/features/labels/types';
import { taskService } from '@/features/tasks/services/task.service';
import {
  getTaskAssignees,
  PRIORITY_OPTIONS,
  priorityStyles,
} from '@/features/tasks/types';
import { toDateInputValue } from '@/features/tasks/utils/dates';
import { Input } from '@/shared/components/ui/Input';
import { TextArea } from '@/shared/components/ui/TextArea';
import { SelectField } from '@/shared/components/ui/SelectField';
import { DateInput } from '@/shared/components/ui/DateInput';
import { getApiErrorMessage } from '@/lib/api';
import { AppModal } from '@/shared/components/ui/AppModal';
import { MemberMultiSelect } from './MemberMultiSelect';
import { TaskChecklistEditor } from './TaskChecklistEditor';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  columnId: z.string().min(1),
  dueDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const FORM_ID = 'task-edit-form';

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

interface TaskModalProps {
  task: BoardTask;
  columns: BoardColumn[];
  members: ProjectMember[];
  projectId: string;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function TaskModal({
  task,
  columns,
  members,
  projectId,
  onClose,
  onRefresh,
  onSave,
  onDelete,
}: TaskModalProps) {
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [assigneeIds, setAssigneeIds] = useState(() =>
    getTaskAssignees(task).map((assignee) => assignee.id),
  );
  const { labels: projectLabels, createLabel } = useProjectLabels(projectId);
  const taskLabels = normalizeTaskLabels(task.labels);
  const checklistItems = task.checklistItems ?? [];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      columnId: task.columnId,
      dueDate: toDateInputValue(task.dueDate),
    },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const nextDueDate = data.dueDate?.trim() ? data.dueDate : null;
      const currentDueDate = task.dueDate
        ? toDateInputValue(task.dueDate)
        : null;
      const currentAssigneeIds = getTaskAssignees(task).map(
        (assignee) => assignee.id,
      );

      await taskService.update(task.id, {
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        columnId: data.columnId !== task.columnId ? data.columnId : undefined,
        dueDate: nextDueDate !== currentDueDate ? nextDueDate : undefined,
        assigneeIds: !arraysEqual(assigneeIds, currentAssigneeIds)
          ? assigneeIds
          : undefined,
      });
      await onSave();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    setIsDeleting(true);
    setError('');
    try {
      await taskService.delete(task.id);
      await onDelete();
    } catch (err) {
      setError(getApiErrorMessage(err));
      setIsDeleting(false);
    }
  };

  const priorityOptions = PRIORITY_OPTIONS.map((priority) => ({
    value: priority,
    label: priorityStyles[priority].label,
  }));

  const columnOptions = columns.map((column) => ({
    value: column.id,
    label: column.name,
  }));

  return (
    <AppModal
      title="Edit Task"
      onClose={onClose}
      width={672}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button danger loading={isDeleting} onClick={handleDelete}>
            Delete
          </Button>
          <div className="flex gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              form={FORM_ID}
              loading={isSubmitting}
            >
              Save
            </Button>
          </div>
        </div>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        id={FORM_ID}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <Input
          label="Title"
          error={errors.title?.message}
          {...register('title')}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextArea label="Description" rows={3} {...field} />
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <SelectField
                label="Priority"
                options={priorityOptions}
                {...field}
              />
            )}
          />

          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <DateInput
                label="Due Date"
                error={errors.dueDate?.message}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Assignees
          </label>
          <MemberMultiSelect
            members={members}
            value={assigneeIds}
            onChange={setAssigneeIds}
          />
        </div>

        <Controller
          name="columnId"
          control={control}
          render={({ field }) => (
            <SelectField label="Column" options={columnOptions} {...field} />
          )}
        />
      </form>

      <div className="mt-6 space-y-6 border-t border-gray-100 pt-6">
        <TaskChecklistEditor
          taskId={task.id}
          items={checklistItems}
          onChange={onRefresh}
        />

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Labels</h3>
          <LabelBadges labels={taskLabels} />
          <TaskLabelPicker
            taskId={task.id}
            projectLabels={projectLabels}
            selectedLabels={taskLabels}
            onChange={onRefresh}
            onCreateLabel={async (name, color) => createLabel({ name, color })}
          />
        </div>

        <TaskComments taskId={task.id} />
        <TaskAttachments taskId={task.id} />
      </div>
    </AppModal>
  );
}
