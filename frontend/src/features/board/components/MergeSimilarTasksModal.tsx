'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Radio } from 'antd';
import type { BoardTask } from '../types';
import {
  groupSimilarTasksByTitle,
  pickDefaultMergeTargetId,
  type SimilarTaskGroup,
} from '@/features/tasks/utils/similarTasks';
import { useLocale } from '@/i18n/LocaleProvider';
import { AppModal } from '@/shared/components/ui/AppModal';
import { getApiErrorMessage } from '@/lib/api';

interface MergeSimilarTasksModalProps {
  tasks: BoardTask[];
  canMerge: boolean;
  canDelete: boolean;
  onClose: () => void;
  onMerge: (input: {
    targetTaskId: string;
    sourceTaskIds: string[];
    mergeChecklists: boolean;
  }) => Promise<void>;
  onDeleteSources: (sourceTaskIds: string[]) => Promise<void>;
}

function boardLabel(task: BoardTask, fallback: string): string {
  return task.board?.name ?? fallback;
}

export function MergeSimilarTasksModal({
  tasks,
  canMerge,
  canDelete,
  onClose,
  onMerge,
  onDeleteSources,
}: MergeSimilarTasksModalProps) {
  const { t } = useLocale();
  const groups = useMemo(() => groupSimilarTasksByTitle(tasks), [tasks]);

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [targetTaskId, setTargetTaskId] = useState('');
  const [mergeChecklists, setMergeChecklists] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeGroup: SimilarTaskGroup<BoardTask> | null = useMemo(() => {
    if (!activeGroupId) return groups[0] ?? null;
    return groups.find((group) => group.id === activeGroupId) ?? groups[0] ?? null;
  }, [activeGroupId, groups]);

  useEffect(() => {
    if (!activeGroup) {
      setSelectedIds(new Set());
      setTargetTaskId('');
      return;
    }

    setSelectedIds(new Set(activeGroup.tasks.map((task) => task.id)));
    setTargetTaskId(pickDefaultMergeTargetId(activeGroup.tasks));
  }, [activeGroup]);

  const selectedTasks = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.tasks.filter((task) => selectedIds.has(task.id));
  }, [activeGroup, selectedIds]);

  const sourceTaskIds = useMemo(
    () => selectedTasks.map((task) => task.id).filter((id) => id !== targetTaskId),
    [selectedTasks, targetTaskId],
  );

  const toggleTask = (taskId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  };

  useEffect(() => {
    if (!selectedIds.has(targetTaskId) && selectedTasks[0]) {
      setTargetTaskId(pickDefaultMergeTargetId(selectedTasks));
    }
  }, [selectedIds, selectedTasks, targetTaskId]);

  const handleMerge = async () => {
    if (!canMerge || !targetTaskId || sourceTaskIds.length === 0) return;
    setError('');
    setIsSubmitting(true);
    try {
      await onMerge({
        targetTaskId,
        sourceTaskIds,
        mergeChecklists,
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSources = async () => {
    if (!canDelete || sourceTaskIds.length === 0) return;
    if (
      !confirm(
        t('board.merge.deleteSourcesConfirm', { count: sourceTaskIds.length }),
      )
    ) {
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onDeleteSources(sourceTaskIds);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppModal
      title={t('board.merge.title')}
      subtitle={t('board.merge.subtitle')}
      onClose={onClose}
      width={640}
      footer={
        <>
          <Button onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          {canDelete && (
            <Button
              danger
              loading={isSubmitting}
              disabled={sourceTaskIds.length === 0}
              onClick={() => void handleDeleteSources()}
            >
              {t('board.merge.deleteSources', { count: sourceTaskIds.length })}
            </Button>
          )}
          {canMerge && (
            <Button
              type="primary"
              loading={isSubmitting}
              disabled={sourceTaskIds.length === 0 || !targetTaskId}
              onClick={() => void handleMerge()}
            >
              {t('board.merge.mergeAction')}
            </Button>
          )}
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {groups.length === 0 ? (
        <p className="text-sm text-gray-600">{t('board.merge.noGroups')}</p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="block text-sm font-medium text-gray-700">
              {t('board.merge.groupsLabel')}
            </span>
            <div className="flex max-h-28 flex-col gap-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroupId(group.id)}
                  className={`rounded-md px-3 py-2 text-start text-sm transition ${
                    activeGroup?.id === group.id
                      ? 'bg-primary-50 font-medium text-primary-800'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {group.label}
                  <span className="ms-2 text-xs text-gray-500">
                    ({group.tasks.length})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {activeGroup && (
            <>
              <div className="space-y-2">
                <span className="block text-sm font-medium text-gray-700">
                  {t('board.merge.pickTasks')}
                </span>
                <Radio.Group
                  className="flex w-full flex-col gap-2"
                  value={targetTaskId}
                  onChange={(event) => setTargetTaskId(event.target.value)}
                >
                  {activeGroup.tasks.map((task) => {
                    const checked = selectedIds.has(task.id);
                    return (
                      <label
                        key={task.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 ${
                          checked
                            ? 'border-primary-200 bg-primary-50/40'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={checked}
                          onChange={(event) =>
                            toggleTask(task.id, event.target.checked)
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {task.title}
                            </span>
                            {task.isCompleted ? (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                {t('board.completed')}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {boardLabel(task, t('common.emDash'))}
                            {task.column?.name
                              ? ` · ${task.column.name}`
                              : ''}
                          </p>
                        </div>
                        <Radio
                          value={task.id}
                          disabled={!checked}
                          aria-label={t('board.merge.keepTarget')}
                        >
                          <span className="text-xs text-gray-600">
                            {t('board.merge.keep')}
                          </span>
                        </Radio>
                      </label>
                    );
                  })}
                </Radio.Group>
              </div>

              {canMerge && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <Checkbox
                    checked={mergeChecklists}
                    onChange={(event) =>
                      setMergeChecklists(event.target.checked)
                    }
                  />
                  {t('board.merge.mergeChecklists')}
                </label>
              )}

              <p className="text-xs text-gray-500">
                {t('board.merge.hint', {
                  sources: sourceTaskIds.length,
                })}
              </p>
            </>
          )}
        </div>
      )}
    </AppModal>
  );
}
