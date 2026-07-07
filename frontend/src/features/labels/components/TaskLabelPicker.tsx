'use client';

import { useState } from 'react';
import type { ProjectLabel, TaskLabel } from '../types';
import { LABEL_COLOR_OPTIONS } from '../types';
import { labelService } from '../services/label.service';
import { useLocale } from '@/i18n/LocaleProvider';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';

interface TaskLabelPickerProps {
  taskId: string;
  projectLabels: ProjectLabel[];
  selectedLabels: TaskLabel[];
  onChange: () => Promise<void>;
  onCreateLabel?: (name: string, color: string) => Promise<ProjectLabel | null>;
}

export function TaskLabelPicker({
  taskId,
  projectLabels,
  selectedLabels,
  onChange,
  onCreateLabel,
}: TaskLabelPickerProps) {
  const { t } = useLocale();
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(LABEL_COLOR_OPTIONS[0]);

  const selectedIds = new Set(selectedLabels.map((label) => label.id));

  const toggleLabel = async (label: ProjectLabel) => {
    setError('');
    setIsBusy(true);
    try {
      if (selectedIds.has(label.id)) {
        await labelService.remove(taskId, label.id);
      } else {
        await labelService.assign(taskId, label.id);
      }
      await onChange();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!onCreateLabel || !newName.trim()) return;

    setError('');
    setIsBusy(true);
    try {
      const created = await onCreateLabel(newName.trim(), newColor);
      if (created) {
        await labelService.assign(taskId, created.id);
        await onChange();
      }
      setNewName('');
      setShowCreate(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {projectLabels.map((label) => {
          const active = selectedIds.has(label.id);
          return (
            <button
              key={label.id}
              type="button"
              disabled={isBusy}
              onClick={() => void toggleLabel(label)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                active
                  ? 'text-white ring-2 ring-offset-1'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={
                active
                  ? { backgroundColor: label.color, outlineColor: label.color }
                  : undefined
              }
            >
              {label.name}
            </button>
          );
        })}
      </div>

      {onCreateLabel && (
        <div className="space-y-2">
          {showCreate ? (
            <div className="rounded-lg border border-gray-200 p-3">
              <Input
                label={t('labels.addLabel')}
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {LABEL_COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Color ${color}`}
                    onClick={() => setNewColor(color)}
                    className={`h-6 w-6 rounded-full border-2 ${
                      newColor === color
                        ? 'border-gray-900'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => void handleCreate()}
                  isLoading={isBusy}
                >
                  {t('labels.addLabel')}
                </Button>
                <Button
                  type="button"
                  className="px-3 py-1.5 text-xs"
                  variant="secondary"
                  onClick={() => setShowCreate(false)}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              className="px-3 py-1.5 text-xs"
              variant="secondary"
              onClick={() => setShowCreate(true)}
            >
              + {t('labels.createLabel')}
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
