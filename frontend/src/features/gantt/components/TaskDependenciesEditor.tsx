'use client';

import { useMemo, useState } from 'react';
import {
  useGanttDependencyMutations,
  useTaskDependencies,
} from '../hooks/useGanttDependencyMutations';
import { useProjectGantt } from '../hooks/useProjectGantt';
import { PlusIcon } from '@/shared/components/icons/PlusIcon';
import { TrashIcon } from '@/shared/components/icons/TrashIcon';
import { IconActionButton } from '@/shared/components/ui/IconActionButton';
import { SelectField } from '@/shared/components/ui/SelectField';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { useLocale } from '@/i18n/LocaleProvider';

interface TaskDependenciesEditorProps {
  taskId: string;
  projectId: string;
  canEdit: boolean;
}

export function TaskDependenciesEditor({
  taskId,
  projectId,
  canEdit,
}: TaskDependenciesEditorProps) {
  const { t } = useLocale();
  const [predecessorId, setPredecessorId] = useState('');
  const { data: ganttData } = useProjectGantt(projectId, true);
  const { data, isLoading } = useTaskDependencies(taskId, true);
  const { createDependency, deleteDependency, isCreating, isDeleting } =
    useGanttDependencyMutations(projectId, taskId);

  const candidateTasks = useMemo(
    () => [...ganttData.scheduled, ...ganttData.unscheduled],
    [ganttData.scheduled, ganttData.unscheduled],
  );

  const predecessorOptions = useMemo(
    () =>
      candidateTasks
        .filter((candidate) => candidate.id !== taskId)
        .map((candidate) => ({
          value: candidate.id,
          label: `${candidate.title} (${candidate.boardName})`,
        })),
    [candidateTasks, taskId],
  );

  const handleAddPredecessor = async () => {
    if (!predecessorId) return;
    await createDependency({
      fromTaskId: predecessorId,
      toTaskId: taskId,
    });
    setPredecessorId('');
  };

  return (
    <section className="space-y-3 border-t border-gray-100 pt-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {t('gantt.dependencies')}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {t('gantt.dependenciesTaskHint')}
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {data?.predecessors.length ? (
            <ul className="space-y-2">
              {data.predecessors.map((dependency) => (
                <li
                  key={dependency.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium text-gray-900">
                      {dependency.fromTaskTitle}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {dependency.fromBoardName}
                    </span>
                  </span>
                  {canEdit && (
                    <IconActionButton
                      label={t('common.remove')}
                      tone="danger"
                      disabled={isDeleting}
                      onClick={() => void deleteDependency(dependency.id)}
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </IconActionButton>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">{t('gantt.noPredecessors')}</p>
          )}

          {data?.successors.length ? (
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <p className="font-medium text-gray-800">{t('gantt.blocks')}</p>
              <ul className="mt-1 space-y-1">
                {data.successors.map((dependency) => (
                  <li key={dependency.id}>
                    {dependency.toTaskTitle}{' '}
                    <span className="text-xs text-gray-500">
                      ({dependency.toBoardName})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}

      {canEdit && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[14rem] flex-1">
            <SelectField
              label={t('gantt.blockedBy')}
              value={predecessorId || undefined}
              onChange={(value) => setPredecessorId(String(value ?? ''))}
              options={[
                { value: '', label: t('gantt.selectPredecessor') },
                ...predecessorOptions,
              ]}
            />
          </div>
          <IconActionButton
            label={t('common.add')}
            tone="primary"
            disabled={!predecessorId || isCreating}
            onClick={() => void handleAddPredecessor()}
            className="h-10 w-10"
          >
            <PlusIcon className="h-4 w-4" />
          </IconActionButton>
        </div>
      )}
    </section>
  );
}
