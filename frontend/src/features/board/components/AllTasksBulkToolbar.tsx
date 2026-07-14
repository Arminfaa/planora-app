'use client';

import { Checkbox, Dropdown, Slider } from 'antd';
import type { MenuProps } from 'antd';
import type { BoardColumn } from '../types';
import type { ProjectMember } from '@/features/projects/types';
import type { ProjectLabel } from '@/features/labels/types';
import {
  PRIORITY_OPTIONS,
  getPriorityStyles,
  type TaskPriority,
} from '@/features/tasks/types';
import type {
  BulkOperationMode,
  BulkTaskAction,
} from '@/features/tasks/types/bulkActions';
import {
  DEFAULT_CHECKLIST_WEIGHT,
  MAX_CHECKLIST_WEIGHT,
  MIN_CHECKLIST_WEIGHT,
} from '@/features/tasks/utils/checklistProgress';
import { useLocale } from '@/i18n/LocaleProvider';
import { Button } from '@/shared/components/ui/Button';
import { DateInput } from '@/shared/components/ui/DateInput';
import { Input } from '@/shared/components/ui/Input';
import { SelectField } from '@/shared/components/ui/SelectField';
import { MemberMultiSelect } from './MemberMultiSelect';

interface AllTasksBulkToolbarProps {
  mode: BulkOperationMode;
  columns: BoardColumn[];
  members: ProjectMember[];
  projectLabels: ProjectLabel[];
  selectedCount: number;
  allFilteredSelected: boolean;
  someFilteredSelected: boolean;
  isApplying: boolean;
  canMoveTasks: boolean;
  canEditTasks: boolean;
  canAssignLabels: boolean;
  onToggleSelectAll: (selected: boolean) => void;
  onExit: () => void;
  onApplyAction: (action: BulkTaskAction) => Promise<void>;
  onExport: () => void;
  form: BulkFormState;
  onFormChange: (patch: Partial<BulkFormState>) => void;
}

export interface BulkFormState {
  columnId: string;
  dueDate: string;
  startDate: string;
  completeDate: string;
  clearDueDate: boolean;
  clearStartDate: boolean;
  clearCompleteDate: boolean;
  assigneeIds: string[];
  priority: string;
  isCompleted: string;
  progress: number;
  labelIds: string[];
  checklistTitle: string;
  checklistWeight: string;
}

export function createEmptyBulkFormState(): BulkFormState {
  return {
    columnId: '',
    dueDate: '',
    startDate: '',
    completeDate: '',
    clearDueDate: false,
    clearStartDate: false,
    clearCompleteDate: false,
    assigneeIds: [],
    priority: 'MEDIUM',
    isCompleted: 'true',
    progress: 0,
    labelIds: [],
    checklistTitle: '',
    checklistWeight: String(DEFAULT_CHECKLIST_WEIGHT),
  };
}

const WEIGHT_OPTIONS = Array.from(
  { length: MAX_CHECKLIST_WEIGHT - MIN_CHECKLIST_WEIGHT + 1 },
  (_, index) => {
    const value = String(MIN_CHECKLIST_WEIGHT + index);
    return { value, label: value };
  },
);

function hintForMode(
  mode: BulkOperationMode,
  t: (key: string) => string,
): string {
  switch (mode) {
    case 'move':
      return t('board.bulkHints.move');
    case 'dueDate':
      return t('board.bulkHints.dueDate');
    case 'startDate':
      return t('board.bulkHints.startDate');
    case 'completeDate':
      return t('board.bulkHints.completeDate');
    case 'assignees':
      return t('board.bulkHints.assignees');
    case 'priority':
      return t('board.bulkHints.priority');
    case 'completed':
      return t('board.bulkHints.completed');
    case 'progress':
      return t('board.bulkHints.progress');
    case 'addLabels':
      return t('board.bulkHints.addLabels');
    case 'removeLabels':
      return t('board.bulkHints.removeLabels');
    case 'setLabels':
      return t('board.bulkHints.setLabels');
    case 'checklist':
      return t('board.bulkHints.checklist');
    case 'export':
      return t('board.selectionModeExportHint');
    default:
      return '';
  }
}

export function AllTasksBulkToolbar({
  mode,
  columns,
  members,
  projectLabels,
  selectedCount,
  allFilteredSelected,
  someFilteredSelected,
  isApplying,
  canMoveTasks,
  canEditTasks,
  canAssignLabels,
  onToggleSelectAll,
  onExit,
  onApplyAction,
  onExport,
  form,
  onFormChange,
}: AllTasksBulkToolbarProps) {
  const { t } = useLocale();
  const priorityStyles = getPriorityStyles(t);

  const columnOptions = columns.map((column) => ({
    value: column.id,
    label: column.name,
  }));

  const priorityOptions = PRIORITY_OPTIONS.map((priority) => ({
    value: priority,
    label: priorityStyles[priority].label,
  }));

  const labelOptions = projectLabels.map((label) => ({
    value: label.id,
    label: label.name,
  }));

  const canApply = selectedCount > 0 && !isApplying;

  const handleApply = async () => {
    if (!canApply) return;

    switch (mode) {
      case 'move':
        if (!form.columnId || !canMoveTasks) return;
        await onApplyAction({ type: 'move', columnId: form.columnId });
        break;
      case 'dueDate':
        if (!canEditTasks) return;
        if (!form.clearDueDate && !form.dueDate.trim()) return;
        await onApplyAction({
          type: 'setDueDate',
          dueDate: form.clearDueDate ? null : form.dueDate.trim(),
        });
        break;
      case 'startDate':
        if (!canEditTasks) return;
        if (!form.clearStartDate && !form.startDate.trim()) return;
        await onApplyAction({
          type: 'setStartDate',
          startDate: form.clearStartDate ? null : form.startDate.trim(),
        });
        break;
      case 'completeDate':
        if (!canEditTasks) return;
        if (!form.clearCompleteDate && !form.completeDate.trim()) return;
        await onApplyAction({
          type: 'setCompleteDate',
          completeDate: form.clearCompleteDate
            ? null
            : form.completeDate.trim(),
        });
        break;
      case 'assignees':
        if (!canEditTasks) return;
        await onApplyAction({
          type: 'setAssignees',
          assigneeIds: form.assigneeIds,
        });
        break;
      case 'priority':
        if (!canEditTasks || !form.priority) return;
        await onApplyAction({
          type: 'setPriority',
          priority: form.priority as TaskPriority,
        });
        break;
      case 'completed':
        if (!canEditTasks) return;
        await onApplyAction({
          type: 'setCompleted',
          isCompleted: form.isCompleted === 'true',
        });
        break;
      case 'progress':
        if (!canEditTasks) return;
        await onApplyAction({
          type: 'setProgress',
          progress: form.progress,
        });
        break;
      case 'addLabels':
        if (!canAssignLabels || form.labelIds.length === 0) return;
        await onApplyAction({ type: 'addLabels', labelIds: form.labelIds });
        break;
      case 'removeLabels':
        if (!canAssignLabels || form.labelIds.length === 0) return;
        await onApplyAction({ type: 'removeLabels', labelIds: form.labelIds });
        break;
      case 'setLabels':
        if (!canAssignLabels) return;
        await onApplyAction({ type: 'setLabels', labelIds: form.labelIds });
        break;
      case 'checklist':
        if (!canEditTasks || !form.checklistTitle.trim()) return;
        await onApplyAction({
          type: 'addChecklistItem',
          title: form.checklistTitle.trim(),
          weight: Number(form.checklistWeight) || DEFAULT_CHECKLIST_WEIGHT,
        });
        break;
      default:
        break;
    }
  };

  const applyDisabled =
    !canApply ||
    (mode === 'move' && !form.columnId) ||
    (mode === 'dueDate' && !form.clearDueDate && !form.dueDate.trim()) ||
    (mode === 'startDate' && !form.clearStartDate && !form.startDate.trim()) ||
    (mode === 'completeDate' &&
      !form.clearCompleteDate &&
      !form.completeDate.trim()) ||
    (mode === 'addLabels' && form.labelIds.length === 0) ||
    (mode === 'removeLabels' && form.labelIds.length === 0) ||
    (mode === 'checklist' && !form.checklistTitle.trim());

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-800">
          {t(`board.bulkOps.${mode}`)}
        </p>
        <p className="text-sm text-gray-600">{hintForMode(mode, t)}</p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <Checkbox
            checked={allFilteredSelected}
            indeterminate={someFilteredSelected}
            onChange={(event) => onToggleSelectAll(event.target.checked)}
          />
          <span>
            {t('board.bulkSelectAll')}
            {selectedCount > 0 && (
              <span className="ms-1 font-medium text-primary-700">
                · {t('board.bulkSelectedCount', { count: selectedCount })}
              </span>
            )}
          </span>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          {mode === 'move' && (
            <div className="min-w-[200px]">
              <SelectField
                label={t('board.bulkMoveToColumn')}
                value={form.columnId}
                onChange={(value) =>
                  onFormChange({ columnId: String(value ?? '') })
                }
                options={columnOptions}
                showSearch
                optionFilterProp="label"
              />
            </div>
          )}

          {mode === 'dueDate' && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <DateInput
                label={t('tasks.dueDate')}
                value={form.clearDueDate ? '' : form.dueDate}
                onChange={(value) =>
                  onFormChange({ dueDate: value, clearDueDate: false })
                }
                disabled={form.clearDueDate}
              />
              <label className="flex items-center gap-2 pb-2 text-sm text-gray-600">
                <Checkbox
                  checked={form.clearDueDate}
                  onChange={(event) =>
                    onFormChange({ clearDueDate: event.target.checked })
                  }
                />
                {t('board.bulkClearValue')}
              </label>
            </div>
          )}

          {mode === 'startDate' && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <DateInput
                label={t('tasks.startDate')}
                value={form.clearStartDate ? '' : form.startDate}
                onChange={(value) =>
                  onFormChange({ startDate: value, clearStartDate: false })
                }
                disabled={form.clearStartDate}
              />
              <label className="flex items-center gap-2 pb-2 text-sm text-gray-600">
                <Checkbox
                  checked={form.clearStartDate}
                  onChange={(event) =>
                    onFormChange({ clearStartDate: event.target.checked })
                  }
                />
                {t('board.bulkClearValue')}
              </label>
            </div>
          )}

          {mode === 'completeDate' && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <DateInput
                label={t('tasks.completeDate')}
                value={form.clearCompleteDate ? '' : form.completeDate}
                onChange={(value) =>
                  onFormChange({
                    completeDate: value,
                    clearCompleteDate: false,
                  })
                }
                disabled={form.clearCompleteDate}
              />
              <label className="flex items-center gap-2 pb-2 text-sm text-gray-600">
                <Checkbox
                  checked={form.clearCompleteDate}
                  onChange={(event) =>
                    onFormChange({ clearCompleteDate: event.target.checked })
                  }
                />
                {t('board.bulkClearValue')}
              </label>
            </div>
          )}

          {mode === 'assignees' && (
            <div className="min-w-[220px]">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('tasks.assignee')}
              </label>
              <MemberMultiSelect
                members={members}
                value={form.assigneeIds}
                onChange={(assigneeIds) => onFormChange({ assigneeIds })}
              />
            </div>
          )}

          {mode === 'priority' && (
            <div className="min-w-[180px]">
              <SelectField
                label={t('tasks.priority')}
                value={form.priority}
                onChange={(value) =>
                  onFormChange({ priority: String(value ?? 'MEDIUM') })
                }
                options={priorityOptions}
              />
            </div>
          )}

          {mode === 'completed' && (
            <div className="min-w-[180px]">
              <SelectField
                label={t('board.bulkOps.completed')}
                value={form.isCompleted}
                onChange={(value) =>
                  onFormChange({ isCompleted: String(value ?? 'true') })
                }
                options={[
                  { value: 'true', label: t('export.statusCompleted') },
                  { value: 'false', label: t('export.statusNotCompleted') },
                ]}
              />
            </div>
          )}

          {mode === 'progress' && (
            <div className="min-w-[220px] space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {t('tasks.progress')}
                </span>
                <span className="text-gray-500">{form.progress}%</span>
              </div>
              <Slider
                min={0}
                max={100}
                value={form.progress}
                onChange={(value) => onFormChange({ progress: Number(value) })}
              />
            </div>
          )}

          {(mode === 'addLabels' ||
            mode === 'removeLabels' ||
            mode === 'setLabels') && (
            <div className="min-w-[220px]">
              <SelectField
                label={t('tasks.labels')}
                mode="multiple"
                value={form.labelIds}
                onChange={(value) =>
                  onFormChange({
                    labelIds: Array.isArray(value) ? value.map(String) : [],
                  })
                }
                options={labelOptions}
                showSearch
                optionFilterProp="label"
              />
            </div>
          )}

          {mode === 'checklist' && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-[220px]">
                <Input
                  label={t('tasks.checklist')}
                  value={form.checklistTitle}
                  onChange={(event) =>
                    onFormChange({ checklistTitle: event.target.value })
                  }
                  placeholder={t('tasks.addChecklistPlaceholder')}
                />
              </div>
              <div className="w-24">
                <SelectField
                  label={t('tasks.checklistWeight')}
                  value={form.checklistWeight}
                  onChange={(value) =>
                    onFormChange({ checklistWeight: String(value) })
                  }
                  options={WEIGHT_OPTIONS}
                />
              </div>
            </div>
          )}

          {mode === 'export' ? (
            <Button
              type="button"
              onClick={onExport}
              disabled={selectedCount === 0}
            >
              {t('board.selectionExportSelected', { count: selectedCount })}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void handleApply()}
              disabled={applyDisabled}
            >
              {isApplying
                ? t('board.bulkApplying')
                : t('board.bulkApply', { count: selectedCount })}
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            onClick={onExit}
            disabled={isApplying}
          >
            {t('board.selectionExitMode')}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface OperationsMenuProps {
  canMoveTasks: boolean;
  canEditTasks: boolean;
  canAssignLabels: boolean;
  disabled?: boolean;
  onSelect: (mode: BulkOperationMode) => void;
}

export function AllTasksOperationsMenu({
  canMoveTasks,
  canEditTasks,
  canAssignLabels,
  disabled,
  onSelect,
}: OperationsMenuProps) {
  const { t } = useLocale();

  const items: MenuProps['items'] = [
    canMoveTasks ? { key: 'move', label: t('board.bulkOps.move') } : null,
    canEditTasks
      ? { key: 'startDate', label: t('board.bulkOps.startDate') }
      : null,
    canEditTasks ? { key: 'dueDate', label: t('board.bulkOps.dueDate') } : null,
    canEditTasks
      ? { key: 'completeDate', label: t('board.bulkOps.completeDate') }
      : null,
    canEditTasks
      ? { key: 'assignees', label: t('board.bulkOps.assignees') }
      : null,
    canEditTasks
      ? { key: 'priority', label: t('board.bulkOps.priority') }
      : null,
    canEditTasks
      ? { key: 'completed', label: t('board.bulkOps.completed') }
      : null,
    canEditTasks
      ? { key: 'progress', label: t('board.bulkOps.progress') }
      : null,
    canAssignLabels
      ? { key: 'addLabels', label: t('board.bulkOps.addLabels') }
      : null,
    canAssignLabels
      ? { key: 'removeLabels', label: t('board.bulkOps.removeLabels') }
      : null,
    canAssignLabels
      ? { key: 'setLabels', label: t('board.bulkOps.setLabels') }
      : null,
    canEditTasks
      ? { key: 'checklist', label: t('board.bulkOps.checklist') }
      : null,
    { type: 'divider' },
    { key: 'export', label: t('board.bulkOps.export') },
  ].filter(Boolean) as MenuProps['items'];

  return (
    <Dropdown
      menu={{
        items,
        onClick: ({ key }) => onSelect(key as BulkOperationMode),
      }}
      trigger={['click']}
      disabled={disabled}
    >
      <Button type="button" variant="secondary" disabled={disabled}>
        {t('board.operations')}
      </Button>
    </Dropdown>
  );
}
