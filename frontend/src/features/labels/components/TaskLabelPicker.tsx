'use client';

import { useState } from 'react';
import { LABEL_COLOR_OPTIONS } from '../types';
import {
  createTempLabelId,
  getSelectedDraftLabels,
  getVisibleDraftLabels,
  type LabelDraftState,
} from '../types/draft';
import { useLocale } from '@/i18n/LocaleProvider';
import { CheckIcon } from '@/shared/components/icons/CheckIcon';
import { EditIcon } from '@/shared/components/icons/EditIcon';
import { PlusIcon } from '@/shared/components/icons/PlusIcon';
import { TrashIcon } from '@/shared/components/icons/TrashIcon';
import { XIcon } from '@/shared/components/icons/XIcon';
import { IconActionButton } from '@/shared/components/ui/IconActionButton';
import { Input } from '@/shared/components/ui/Input';
import { cn } from '@/lib/utils';

interface TaskLabelPickerProps {
  draft: LabelDraftState;
  onDraftChange: (draft: LabelDraftState) => void;
  canManage?: boolean;
}

function ColorSwatches({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {LABEL_COLOR_OPTIONS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Color ${color}`}
          onClick={() => onChange(color)}
          className={cn(
            'h-6 w-6 rounded-full border-2 transition',
            value === color
              ? 'border-gray-900 scale-110'
              : 'border-transparent',
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

export function TaskLabelPicker({
  draft,
  onDraftChange,
  canManage = true,
}: TaskLabelPickerProps) {
  const { t } = useLocale();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(LABEL_COLOR_OPTIONS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<string>(LABEL_COLOR_OPTIONS[0]);

  const visibleLabels = getVisibleDraftLabels(draft);
  const selectedIds = new Set(draft.selectedIds);
  const selectedPreview = getSelectedDraftLabels(draft);

  const toggleSelected = (labelId: string) => {
    const nextSelected = selectedIds.has(labelId)
      ? draft.selectedIds.filter((id) => id !== labelId)
      : [...draft.selectedIds, labelId];
    onDraftChange({ ...draft, selectedIds: nextSelected });
  };

  const startEdit = (labelId: string) => {
    const label = draft.catalog.find((entry) => entry.id === labelId);
    if (!label || label.isDeleted) return;
    setEditingId(labelId);
    setEditName(label.name);
    setEditColor(label.color);
    setShowCreate(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor(LABEL_COLOR_OPTIONS[0]);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;

    onDraftChange({
      ...draft,
      catalog: draft.catalog.map((label) =>
        label.id === editingId
          ? {
              ...label,
              name: editName.trim(),
              color: editColor,
              isDirty: label.isNew ? label.isDirty : true,
            }
          : label,
      ),
    });
    cancelEdit();
  };

  const handleDelete = (labelId: string) => {
    if (!confirm(t('labels.deleteConfirm'))) return;

    const label = draft.catalog.find((entry) => entry.id === labelId);
    if (!label) return;

    if (label.isNew) {
      onDraftChange({
        catalog: draft.catalog.filter((entry) => entry.id !== labelId),
        selectedIds: draft.selectedIds.filter((id) => id !== labelId),
      });
    } else {
      onDraftChange({
        catalog: draft.catalog.map((entry) =>
          entry.id === labelId ? { ...entry, isDeleted: true } : entry,
        ),
        selectedIds: draft.selectedIds.filter((id) => id !== labelId),
      });
    }

    if (editingId === labelId) cancelEdit();
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;

    const id = createTempLabelId();
    onDraftChange({
      catalog: [
        ...draft.catalog,
        {
          id,
          name,
          color: newColor,
          isNew: true,
        },
      ],
      selectedIds: [...draft.selectedIds, id],
    });
    setNewName('');
    setNewColor(LABEL_COLOR_OPTIONS[0]);
    setShowCreate(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {t('tasks.labels')}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {t('labels.draftHint')}
          </p>
        </div>
        {canManage && !showCreate && (
          <IconActionButton
            label={t('labels.createLabel')}
            tone="primary"
            onClick={() => {
              cancelEdit();
              setShowCreate(true);
            }}
          >
            <PlusIcon className="h-4 w-4" />
          </IconActionButton>
        )}
      </div>

      {selectedPreview.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedPreview.map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {showCreate && canManage && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <Input
            label={t('labels.labelName')}
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleCreate();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                setShowCreate(false);
              }
            }}
            autoFocus
          />
          <div className="mt-2">
            <p className="mb-1.5 text-xs font-medium text-gray-500">
              {t('labels.color')}
            </p>
            <ColorSwatches value={newColor} onChange={setNewColor} />
          </div>
          <div className="mt-3 flex justify-end gap-1">
            <IconActionButton
              label={t('common.cancel')}
              onClick={() => setShowCreate(false)}
            >
              <XIcon className="h-4 w-4" />
            </IconActionButton>
            <IconActionButton
              label={t('labels.createLabel')}
              tone="success"
              disabled={!newName.trim()}
              onClick={handleCreate}
            >
              <CheckIcon className="h-4 w-4" />
            </IconActionButton>
          </div>
        </div>
      )}

      {visibleLabels.length === 0 ? (
        <p className="text-sm text-gray-500">{t('labels.noLabels')}</p>
      ) : (
        <ul className="space-y-1.5">
          {visibleLabels.map((label) => {
            const active = selectedIds.has(label.id);
            const isEditing = editingId === label.id;

            return (
              <li
                key={label.id}
                className={cn(
                  'rounded-xl border px-2.5 py-2 transition',
                  active
                    ? 'border-primary-200 bg-primary-50/60'
                    : 'border-gray-100 bg-gray-50',
                )}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          saveEdit();
                        }
                        if (event.key === 'Escape') {
                          event.preventDefault();
                          cancelEdit();
                        }
                      }}
                      autoFocus
                    />
                    <ColorSwatches value={editColor} onChange={setEditColor} />
                    <div className="flex justify-end gap-1">
                      <IconActionButton
                        label={t('common.cancel')}
                        onClick={cancelEdit}
                      >
                        <XIcon className="h-4 w-4" />
                      </IconActionButton>
                      <IconActionButton
                        label={t('common.save')}
                        tone="success"
                        disabled={!editName.trim()}
                        onClick={saveEdit}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </IconActionButton>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSelected(label.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-0.5 text-start transition hover:bg-white/70"
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="truncate text-sm font-medium text-gray-800">
                        {label.name}
                      </span>
                      {active && (
                        <CheckIcon className="ms-auto h-3.5 w-3.5 shrink-0 text-primary-600" />
                      )}
                    </button>

                    {canManage && (
                      <div className="flex shrink-0 items-center">
                        <IconActionButton
                          label={t('labels.editLabel')}
                          onClick={() => startEdit(label.id)}
                        >
                          <EditIcon className="h-3.5 w-3.5" />
                        </IconActionButton>
                        <IconActionButton
                          label={t('labels.deleteLabel')}
                          tone="danger"
                          onClick={() => handleDelete(label.id)}
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </IconActionButton>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
