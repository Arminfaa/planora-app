'use client';

import { useMemo, useState } from 'react';
import type { GanttDependency, GanttTask } from '../types';
import { useGanttDependencyMutations } from '../hooks/useGanttDependencyMutations';
import { useLocale } from '@/i18n/LocaleProvider';
import { Button } from '@/shared/components/ui/Button';
import { SelectField } from '@/shared/components/ui/SelectField';

interface GanttDependencyPanelProps {
  projectId: string;
  tasks: GanttTask[];
  dependencies: GanttDependency[];
  canEdit: boolean;
}

export function GanttDependencyPanel({
  projectId,
  tasks,
  dependencies,
  canEdit,
}: GanttDependencyPanelProps) {
  const { t } = useLocale();
  const [fromTaskId, setFromTaskId] = useState('');
  const [toTaskId, setToTaskId] = useState('');
  const { createDependency, deleteDependency, isCreating, isDeleting } =
    useGanttDependencyMutations(projectId);

  const taskOptions = useMemo(
    () =>
      tasks.map((task) => ({
        value: task.id,
        label: `${task.title} (${task.boardName})`,
      })),
    [tasks],
  );

  const handleCreate = async () => {
    if (!fromTaskId || !toTaskId || fromTaskId === toTaskId) return;
    await createDependency({ fromTaskId, toTaskId });
    setFromTaskId('');
    setToTaskId('');
  };

  if (!canEdit && dependencies.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {t('gantt.dependencies')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('gantt.dependenciesHint')}
          </p>
        </div>
      </div>

      {canEdit && (
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
          <SelectField
            label={t('gantt.predecessor')}
            value={fromTaskId || undefined}
            onChange={(value) => setFromTaskId(String(value ?? ''))}
            options={[
              { value: '', label: t('gantt.selectTask') },
              ...taskOptions,
            ]}
          />
          <SelectField
            label={t('gantt.successor')}
            value={toTaskId || undefined}
            onChange={(value) => setToTaskId(String(value ?? ''))}
            options={[
              { value: '', label: t('gantt.selectTask') },
              ...taskOptions,
            ]}
          />
          <Button
            type="button"
            onClick={() => void handleCreate()}
            disabled={
              !fromTaskId || !toTaskId || fromTaskId === toTaskId || isCreating
            }
          >
            {t('gantt.addLink')}
          </Button>
        </div>
      )}

      {dependencies.length > 0 ? (
        <div className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-100">
          {dependencies.map((dependency) => (
            <div
              key={dependency.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">
                  {dependency.fromTaskTitle}
                </span>
                <span className="mx-2 text-gray-400">→</span>
                <span className="font-medium text-gray-900">
                  {dependency.toTaskTitle}
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  {dependency.fromBoardName} → {dependency.toBoardName}
                </span>
              </p>
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                  disabled={isDeleting}
                  onClick={() => void deleteDependency(dependency.id)}
                >
                  {t('common.remove')}
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">
          {t('gantt.noDependencies')}
        </p>
      )}
    </section>
  );
}
