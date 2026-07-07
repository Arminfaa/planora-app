'use client';

import { useState } from 'react';
import type { ProjectMember } from '@/features/projects/types';
import type { CreateTaskInput } from '@/features/tasks/types';
import { useLocale } from '@/i18n/LocaleProvider';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { DateInput } from '@/shared/components/ui/DateInput';
import { MemberMultiSelect } from './MemberMultiSelect';

interface AddTaskFormProps {
  members: ProjectMember[];
  onSubmit: (input: CreateTaskInput) => Promise<void>;
}

export function AddTaskForm({ members, onSubmit }: AddTaskFormProps) {
  const { t } = useLocale();
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
        + {t('board.addTask')}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        placeholder={t('tasks.titlePlaceholder')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <DateInput
        value={dueDate}
        onChange={setDueDate}
        placeholder={t('tasks.dueDate')}
      />
      <div className="space-y-1">
        <span className="text-xs font-medium text-gray-600">
          {t('tasks.assignee')}
        </span>
        <MemberMultiSelect
          members={members}
          value={assigneeIds}
          onChange={setAssigneeIds}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          {t('common.add')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setIsOpen(false);
            resetForm();
          }}
        >
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}
