'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

interface AddTaskFormProps {
  onSubmit: (title: string) => Promise<void>;
}

export function AddTaskForm({ onSubmit }: AddTaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(title.trim());
      setTitle('');
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
      <div className="flex gap-2">
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          Add
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setIsOpen(false);
            setTitle('');
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
