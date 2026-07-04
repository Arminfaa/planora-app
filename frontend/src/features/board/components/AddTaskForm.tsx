'use client';

import { useState } from 'react';
import type { ProjectMember } from '@/features/projects/types';
import type { CreateTaskInput } from '@/features/tasks/types';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { MemberMultiSelect } from './MemberMultiSelect';

interface AddTaskFormProps {
  members: ProjectMember[];
  onSubmit: (input: CreateTaskInput) => Promise<void>;
}

export function AddTaskForm({ members, onSubmit }: AddTaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDueDate('');
    setAssigneeIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        dueDate: dueDate || undefined,
        assigneeIds: assigneeIds.length ? assigneeIds : undefined,
      });
      resetForm();
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 transition hover:border-primary-400 hover:text-primary-600"
      >
        + Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        placeholder="Task title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <Input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <div className="space-y-1">
        <span className="text-xs font-medium text-gray-600">Assignees</span>
        <MemberMultiSelect
          members={members}
          value={assigneeIds}
          onChange={setAssigneeIds}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          Add
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setIsOpen(false);
            resetForm();
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
