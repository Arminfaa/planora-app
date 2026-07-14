'use client';

import { useState } from 'react';
import { Checkbox } from 'antd';
import type { TaskChecklistItem } from '@/features/tasks/types';
import { checklistService } from '@/features/tasks/services/checklist.service';
import {
  DEFAULT_CHECKLIST_WEIGHT,
  MAX_CHECKLIST_WEIGHT,
  MIN_CHECKLIST_WEIGHT,
  normalizeChecklistWeight,
} from '@/features/tasks/utils/checklistProgress';
import {
  createTempChecklistId,
  type DraftChecklistItem,
} from '@/features/tasks/utils/syncChecklistItems';
import { useLocale } from '@/i18n/LocaleProvider';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { SelectField } from '@/shared/components/ui/SelectField';
import { getApiErrorMessage } from '@/lib/api';

type ChecklistItem = TaskChecklistItem | DraftChecklistItem;

interface TaskChecklistEditorProps {
  taskId?: string;
  items: ChecklistItem[];
  /** Immediate mode: persist each change via API then call onChange. */
  onChange?: () => Promise<void>;
  /** Draft mode: only update local items. */
  onItemsChange?: (items: DraftChecklistItem[]) => void;
  canToggle?: boolean;
  canEdit?: boolean;
  canManage?: boolean;
}

const WEIGHT_OPTIONS = Array.from(
  { length: MAX_CHECKLIST_WEIGHT - MIN_CHECKLIST_WEIGHT + 1 },
  (_, index) => {
    const value = String(MIN_CHECKLIST_WEIGHT + index);
    return { value, label: value };
  },
);

function toDraftItems(items: ChecklistItem[]): DraftChecklistItem[] {
  return items.map((item, index) => ({
    id: item.id,
    title: item.title,
    isDone: Boolean(item.isDone),
    weight: normalizeChecklistWeight(item.weight),
    position: item.position ?? index,
  }));
}

export function TaskChecklistEditor({
  taskId,
  items,
  onChange,
  onItemsChange,
  canToggle = true,
  canEdit,
  canManage = true,
}: TaskChecklistEditorProps) {
  const { t } = useLocale();
  const canEditItems = canEdit ?? canManage;
  const isDraft = typeof onItemsChange === 'function';
  const [newTitle, setNewTitle] = useState('');
  const [newWeight, setNewWeight] = useState(String(DEFAULT_CHECKLIST_WEIGHT));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const sortedItems = [...items].sort((a, b) => a.position - b.position);

  const updateDraft = (next: DraftChecklistItem[]) => {
    onItemsChange?.(next);
  };

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title || !canManage) return;

    setError('');

    if (isDraft) {
      const nextPosition =
        sortedItems.reduce((max, item) => Math.max(max, item.position), -1) + 1;
      updateDraft([
        ...toDraftItems(items),
        {
          id: createTempChecklistId(),
          title,
          isDone: false,
          weight: normalizeChecklistWeight(Number(newWeight)),
          position: nextPosition,
        },
      ]);
      setNewTitle('');
      setNewWeight(String(DEFAULT_CHECKLIST_WEIGHT));
      return;
    }

    if (!taskId || !onChange) return;

    setIsSubmitting(true);
    try {
      await checklistService.create(taskId, {
        title,
        weight: normalizeChecklistWeight(Number(newWeight)),
      });
      setNewTitle('');
      setNewWeight(String(DEFAULT_CHECKLIST_WEIGHT));
      await onChange();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (item: ChecklistItem) => {
    if (!canToggle) return;
    setError('');

    if (isDraft) {
      updateDraft(
        toDraftItems(items).map((entry) =>
          entry.id === item.id ? { ...entry, isDone: !entry.isDone } : entry,
        ),
      );
      return;
    }

    if (!taskId || !onChange) return;

    try {
      await checklistService.update(taskId, item.id, { isDone: !item.isDone });
      await onChange();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleWeightChange = async (item: ChecklistItem, value: string) => {
    if (!canEditItems) return;
    const weight = normalizeChecklistWeight(Number(value));
    if (weight === normalizeChecklistWeight(item.weight)) return;

    setError('');

    if (isDraft) {
      updateDraft(
        toDraftItems(items).map((entry) =>
          entry.id === item.id ? { ...entry, weight } : entry,
        ),
      );
      return;
    }

    if (!taskId || !onChange) return;

    try {
      await checklistService.update(taskId, item.id, { weight });
      await onChange();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!canManage) return;
    setError('');

    if (isDraft) {
      updateDraft(toDraftItems(items).filter((entry) => entry.id !== itemId));
      if (editingId === itemId) {
        setEditingId(null);
        setEditTitle('');
      }
      return;
    }

    if (!taskId || !onChange) return;

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

  const startEdit = (item: ChecklistItem) => {
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

    if (isDraft) {
      updateDraft(
        toDraftItems(items).map((entry) =>
          entry.id === itemId ? { ...entry, title } : entry,
        ),
      );
      cancelEdit();
      return;
    }

    if (!taskId || !onChange) return;

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
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">
          {t('tasks.checklist')}
        </h3>
        <p className="text-xs text-gray-500">
          {t('tasks.checklistWeightHint')}
        </p>
      </div>

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
              className="flex flex-wrap items-start gap-2 rounded-md border border-gray-100 bg-gray-50 px-2 py-1.5"
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

              <div className="w-20 shrink-0">
                <SelectField
                  value={String(normalizeChecklistWeight(item.weight))}
                  onChange={(value) =>
                    void handleWeightChange(item, String(value))
                  }
                  options={WEIGHT_OPTIONS}
                  disabled={!canEditItems}
                  aria-label={t('tasks.checklistWeight')}
                />
              </div>

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
        <div className="flex flex-col gap-2 sm:flex-row">
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
          <div className="w-full sm:w-24">
            <SelectField
              value={newWeight}
              onChange={(value) => setNewWeight(String(value))}
              options={WEIGHT_OPTIONS}
              aria-label={t('tasks.checklistWeight')}
            />
          </div>
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
