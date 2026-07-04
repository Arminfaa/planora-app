'use client';

import { useState } from 'react';
import { Button } from 'antd';
import type { BoardColumn } from '../types';
import type { ProjectMember } from '@/features/projects/types';
import type { CreateTaskInput } from '@/features/tasks/types';
import { PRIORITY_OPTIONS, priorityStyles } from '@/features/tasks/types';
import { taskService } from '@/features/tasks/services/task.service';
import { Input } from '@/shared/components/ui/Input';
import { TextArea } from '@/shared/components/ui/TextArea';
import { SelectField } from '@/shared/components/ui/SelectField';
import { DateInput } from '@/shared/components/ui/DateInput';
import { getApiErrorMessage } from '@/lib/api';
import { AppModal } from '@/shared/components/ui/AppModal';
import { MemberMultiSelect } from './MemberMultiSelect';

const FORM_ID = 'all-tasks-create-form';

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

  const columnOptions = [
    { value: '', label: 'نامشخص (auto)' },
    ...columns.map((column) => ({ value: column.id, label: column.name })),
  ];

  const priorityOptions = PRIORITY_OPTIONS.map((option) => ({
    value: option,
    label: priorityStyles[option].label,
  }));

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
    <AppModal
      title="New task"
      subtitle='Leave column empty to place the task in "نامشخص".'
      onClose={onClose}
      width={512}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            form={FORM_ID}
            loading={isSubmitting}
          >
            Create task
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={(event) => void handleSubmit(event)}>
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

          <TextArea
            label="Description (optional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />

          <SelectField
            label="Column"
            value={columnId}
            onChange={setColumnId}
            options={columnOptions}
          />

          <SelectField
            label="Priority"
            value={priority}
            onChange={(value) =>
              setPriority(value as CreateTaskInput['priority'])
            }
            options={priorityOptions}
          />

          <DateInput
            label="Due date (optional)"
            value={dueDate}
            onChange={setDueDate}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Assignees (optional)
            </label>
            <MemberMultiSelect
              members={members}
              value={assigneeIds}
              onChange={setAssigneeIds}
            />
          </div>
        </div>
      </form>
    </AppModal>
  );
}
