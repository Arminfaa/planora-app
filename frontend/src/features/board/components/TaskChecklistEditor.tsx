'use client';

import { useState } from 'react';
import { Checkbox } from 'antd';
import type { TaskChecklistItem } from '@/features/tasks/types';
import { checklistService } from '@/features/tasks/services/checklist.service';
import { useLocale } from '@/i18n/LocaleProvider';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';

interface TaskChecklistEditorProps {
  taskId: string;
  items: TaskChecklistItem[];
  onChange: () => Promise<void>;
  canToggle?: boolean;
  canEdit?: boolean;
  canManage?: boolean;
}

export function TaskChecklistEditor({
  taskId,
  items,
  onChange,
  canToggle = true,
  canEdit,
  canManage = true,
}: TaskChecklistEditorProps) {
  const { t } = useLocale();
  const canEditItems = canEdit ?? canManage;
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const sortedItems = [...items].sort((a, b) => a.position - b.position);

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title || !canManage) return;

    setError('');
    setIsSubmitting(true);
    try {
      await checklistService.create(taskId, title);
      setNewTitle('');
      await onChange();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (item: TaskChecklistItem) => {
    if (!canToggle) return;
    setError('');
    try {
      await checklistService.update(taskId, item.id, { isDone: !item.isDone });
      await onChange();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!canManage) return;
    setError('');
    try {
      await checklistService.delete(taskId, itemId);
      if (editingId === itemId) {
        setEditingId(null);
        setEditTitle('');
      }
      await onChange();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const startEdit = (item: TaskChecklistItem) => {
    if (!canEditItems) return;
    setEditingId(item.id);
    setEditTitle(item.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const saveEdit = async (itemId: string) => {
    const title = editTitle.trim();
    if (!title || !canEditItems) return;

    if (title === items.find((item) => item.id === itemId)?.title) {
      cancelEdit();
      return;
    }

    setError('');
    try {
      await checklistService.update(taskId, itemId, { title });
      cancelEdit();
      await onChange();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">
        {t('tasks.checklist')}
      </h3>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {sortedItems.length > 0 ? (
        <ul className="space-y-1.5">
          {sortedItems.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-2 rounded-md border border-gray-100 bg-gray-50 px-2 py-1.5"
            >
              <Checkbox
                checked={item.isDone}
                disabled={!canToggle}
                onChange={() => void handleToggle(item)}
                className="mt-0.5"
              />

              {editingId === item.id ? (
                <Input
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  autoFocus
                  className="min-w-0 flex-1 py-0.5 text-sm"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void saveEdit(item.id);
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      cancelEdit();
                    }
                  }}
                  onBlur={() => void saveEdit(item.id)}
                />
              ) : (
                <button
                  type="button"
                  disabled={!canEditItems}
                  onDoubleClick={() => startEdit(item)}
                  className={`min-w-0 flex-1 text-start text-sm ${
                    item.isDone ? 'text-gray-400 line-through' : 'text-gray-700'
                  } ${canEditItems ? 'cursor-text rounded px-1' : 'cursor-default'}`}
                >
                  {item.title}
                </button>
              )}

              <div className="flex shrink-0 items-center gap-2">
                {canEditItems && editingId !== item.id && (
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => startEdit(item)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {t('common.edit')}
                  </button>
                )}
                {canManage && (
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => void handleDelete(item.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t('common.remove')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">{t('tasks.noChecklistItems')}</p>
      )}

      {canManage && (
        <div className="flex gap-2">
          <Input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder={t('tasks.addChecklistPlaceholder')}
            className="min-w-0 flex-1"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleAdd();
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleAdd()}
            isLoading={isSubmitting}
          >
            {t('common.add')}
          </Button>
        </div>
      )}
    </div>
  );
}
