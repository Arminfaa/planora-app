'use client';

import { useState } from 'react';
import type { BoardColumn } from '../types';
import type { ProjectMember } from '@/features/projects/types';
import type { CreateTaskInput } from '@/features/tasks/types';
import { PRIORITY_OPTIONS, priorityStyles } from '@/features/tasks/types';
import { taskService } from '@/features/tasks/services/task.service';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import { MemberMultiSelect } from './MemberMultiSelect';

interface AllTasksCreateModalProps {
  boardId: string;
  columns: BoardColumn[];
  members: ProjectMember[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}

export function AllTasksCreateModal({
  boardId,
  columns,
  members,
  onClose,
  onCreated,
}: AllTasksCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] =
    useState<CreateTaskInput['priority']>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [columnId, setColumnId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectClassName =
    'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    setError('');
    setIsSubmitting(true);
    try {
      const payload: CreateTaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        assigneeIds: assigneeIds.length ? assigneeIds : undefined,
      };

      if (columnId) {
        payload.columnId = columnId;
      }

      await taskService.createOnBoard(boardId, payload);
      await onCreated();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-task-title"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="border-b border-gray-100 px-6 py-4">
          <h2
            id="create-task-title"
            className="text-lg font-semibold text-gray-900"
          >
            New task
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Leave column empty to place the task in &quot;نامشخص&quot;.
          </p>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              autoFocus
              required
            />

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">
                Description (optional)
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Column</span>
              <select
                value={columnId}
                onChange={(event) => setColumnId(event.target.value)}
                className={selectClassName}
              >
                <option value="">نامشخص (auto)</option>
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">
                Priority
              </span>
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as CreateTaskInput['priority'])
                }
                className={selectClassName}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {priorityStyles[option].label}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label="Due date (optional)"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">
                Assignees (optional)
              </span>
              <MemberMultiSelect
                members={members}
                value={assigneeIds}
                onChange={setAssigneeIds}
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
