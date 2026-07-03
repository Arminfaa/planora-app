'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import type { BoardColumn, BoardTask } from '../types';
import type { ProjectMember } from '@/features/projects/types';
import { taskService } from '@/features/tasks/services/task.service';
import { PRIORITY_OPTIONS, priorityStyles } from '@/features/tasks/types';
import { toDateInputValue } from '@/features/tasks/utils/dates';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  columnId: z.string().min(1),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface TaskModalProps {
  task: BoardTask;
  columns: BoardColumn[];
  members: ProjectMember[];
  onClose: () => void;
  onUpdate: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function TaskModal({
  task,
  columns,
  members,
  onClose,
  onUpdate,
  onDelete,
}: TaskModalProps) {
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
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
      assigneeId: task.assignee?.id ?? '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const nextDueDate = data.dueDate?.trim() ? data.dueDate : null;
      const currentDueDate = task.dueDate
        ? toDateInputValue(task.dueDate)
        : null;
      const nextAssigneeId = data.assigneeId?.trim() ? data.assigneeId : null;
      const currentAssigneeId = task.assignee?.id ?? null;

      await taskService.update(task.id, {
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        columnId: data.columnId !== task.columnId ? data.columnId : undefined,
        dueDate: nextDueDate !== currentDueDate ? nextDueDate : undefined,
        assigneeId:
          nextAssigneeId !== currentAssigneeId ? nextAssigneeId : undefined,
      });
      await onUpdate();
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

  const selectClassName =
    'block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Edit Task</h2>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <Input
            label="Title"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select className={selectClassName} {...register('priority')}>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {priorityStyles[p].label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Due Date"
              type="date"
              error={errors.dueDate?.message}
              {...register('dueDate')}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Assignee
            </label>
            <select className={selectClassName} {...register('assigneeId')}>
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Column
            </label>
            <select className={selectClassName} {...register('columnId')}>
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              isLoading={isDeleting}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Save
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
