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
import { IconActionButton } from '@/shared/components/ui/IconActionButton';
import { XIcon } from '@/shared/components/icons/XIcon';
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
  canDeleteTasks: boolean;
  onToggleSelectAll: (selected: boolean) => void;
  onExit: () => void;
  onApplyAction: (action: BulkTaskAction) => Promise<void>;
  onExport: () => void;
  onExportText: () => void;
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

function ClearDateToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-600">
      <Checkbox
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
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
  canDeleteTasks,
  onToggleSelectAll,
  onExit,
  onApplyAction,
  onExport,
  onExportText,
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
      case 'delete':
        if (!canDeleteTasks) return;
        if (!confirm(t('board.bulkDeleteConfirm', { count: selectedCount }))) {
          return;
        }
        await onApplyAction({ type: 'delete' });
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
    <section className="sticky top-2 z-20 mt-4 overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-b from-primary-50/80 to-white shadow-sm ring-1 ring-primary-100/60">
      <div className="flex items-start justify-between gap-3 border-b border-primary-100/70 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            {t(`board.bulkOps.${mode}`)}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {selectedCount > 0
              ? t('board.bulkSelectedCount', { count: selectedCount })
              : t('board.bulkHints.selectTasksFirst')}
          </p>
        </div>
        <IconActionButton
          label={t('board.selectionExitMode')}
          onClick={onExit}
          disabled={isApplying}
        >
          <XIcon className="h-4 w-4" />
        </IconActionButton>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200">
          <Checkbox
            checked={allFilteredSelected}
            indeterminate={someFilteredSelected}
            onChange={(event) => onToggleSelectAll(event.target.checked)}
          />
          <span className="font-medium">{t('board.bulkSelectAll')}</span>
        </label>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            {mode === 'move' && (
              <div className="min-w-[220px] flex-1">
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
              <>
                <DateInput
                  label={t('tasks.dueDate')}
                  value={form.clearDueDate ? '' : form.dueDate}
                  onChange={(value) =>
                    onFormChange({ dueDate: value, clearDueDate: false })
                  }
                  disabled={form.clearDueDate}
                />
                <ClearDateToggle
                  checked={form.clearDueDate}
                  onChange={(clearDueDate) => onFormChange({ clearDueDate })}
                  label={t('board.bulkClearValue')}
                />
              </>
            )}

            {mode === 'startDate' && (
              <>
                <DateInput
                  label={t('tasks.startDate')}
                  value={form.clearStartDate ? '' : form.startDate}
                  onChange={(value) =>
                    onFormChange({ startDate: value, clearStartDate: false })
                  }
                  disabled={form.clearStartDate}
                />
                <ClearDateToggle
                  checked={form.clearStartDate}
                  onChange={(clearStartDate) =>
                    onFormChange({ clearStartDate })
                  }
                  label={t('board.bulkClearValue')}
                />
              </>
            )}

            {mode === 'completeDate' && (
              <>
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
                <ClearDateToggle
                  checked={form.clearCompleteDate}
                  onChange={(clearCompleteDate) =>
                    onFormChange({ clearCompleteDate })
                  }
                  label={t('board.bulkClearValue')}
                />
              </>
            )}

            {mode === 'assignees' && (
              <div className="min-w-[240px] flex-1">
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
              <div className="min-w-[200px]">
                <SelectField
                  label={t('board.bulkOps.completed')}
                  value={form.isCompleted}
                  onChange={(value) =>
                    onFormChange({ isCompleted: String(value ?? 'true') })
                  }
                  options={[
                    { value: 'true', label: t('export.statusCompleted') },
                    {
                      value: 'false',
                      label: t('export.statusNotCompleted'),
                    },
                  ]}
                />
              </div>
            )}

            {mode === 'progress' && (
              <div className="min-w-[240px] flex-1 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    {t('tasks.progress')}
                  </span>
                  <span className="tabular-nums text-gray-500">
                    {form.progress}%
                  </span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(value) =>
                    onFormChange({ progress: Number(value) })
                  }
                />
              </div>
            )}

            {(mode === 'addLabels' ||
              mode === 'removeLabels' ||
              mode === 'setLabels') && (
              <div className="min-w-[240px] flex-1">
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
              <>
                <div className="min-w-[220px] flex-1">
                  <Input
                    label={t('tasks.checklist')}
                    value={form.checklistTitle}
                    onChange={(event) =>
                      onFormChange({ checklistTitle: event.target.value })
                    }
                    placeholder={t('tasks.addChecklistPlaceholder')}
                  />
                </div>
                <div className="w-28">
                  <SelectField
                    label={t('tasks.checklistWeight')}
                    value={form.checklistWeight}
                    onChange={(value) =>
                      onFormChange({ checklistWeight: String(value) })
                    }
                    options={WEIGHT_OPTIONS}
                  />
                </div>
              </>
            )}

            {mode === 'export' && (
              <p className="max-w-md text-sm text-gray-600">
                {t('board.selectionModeExportHint')}
              </p>
            )}

            {mode === 'exportText' && (
              <p className="max-w-md text-sm text-gray-600">
                {t('board.bulkHints.exportText')}
              </p>
            )}

            {mode === 'delete' && (
              <p className="max-w-md text-sm text-red-700">
                {t('board.bulkHints.delete')}
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            {mode === 'export' ? (
              <Button
                type="button"
                onClick={onExport}
                disabled={selectedCount === 0}
                className="rounded-xl"
              >
                {t('board.selectionExportSelected', { count: selectedCount })}
              </Button>
            ) : mode === 'exportText' ? (
              <Button
                type="button"
                onClick={onExportText}
                disabled={selectedCount === 0}
                className="rounded-xl"
              >
                {t('board.selectionExportTextSelected', {
                  count: selectedCount,
                })}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void handleApply()}
                disabled={applyDisabled}
                className={`rounded-xl ${
                  mode === 'delete'
                    ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500'
                    : ''
                }`}
              >
                {isApplying
                  ? t('board.bulkApplying')
                  : mode === 'delete'
                    ? t('board.bulkDeleteApply', { count: selectedCount })
                    : t('board.bulkApply', { count: selectedCount })}
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={onExit}
              disabled={isApplying}
              className="rounded-xl"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

interface OperationsMenuProps {
  canMoveTasks: boolean;
  canEditTasks: boolean;
  canAssignLabels: boolean;
  canDeleteTasks: boolean;
  activeMode?: BulkOperationMode | null;
  disabled?: boolean;
  onSelect: (mode: BulkOperationMode) => void;
}

function SlidersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h8M16 18h4M14 4v4M8 10v4M12 16v4"
      />
    </svg>
  );
}

export function AllTasksOperationsMenu({
  canMoveTasks,
  canEditTasks,
  canAssignLabels,
  canDeleteTasks,
  activeMode = null,
  disabled,
  onSelect,
}: OperationsMenuProps) {
  const { t } = useLocale();

  const groups: NonNullable<MenuProps['items']> = [];

  if (canMoveTasks) {
    groups.push({
      type: 'group',
      label: t('board.bulkGroups.placement'),
      children: [{ key: 'move', label: t('board.bulkOps.move') }],
    });
  }

  if (canEditTasks) {
    groups.push({
      type: 'group',
      label: t('board.bulkGroups.dates'),
      children: [
        { key: 'startDate', label: t('board.bulkOps.startDate') },
        { key: 'dueDate', label: t('board.bulkOps.dueDate') },
        { key: 'completeDate', label: t('board.bulkOps.completeDate') },
      ],
    });
    groups.push({
      type: 'group',
      label: t('board.bulkGroups.status'),
      children: [
        { key: 'assignees', label: t('board.bulkOps.assignees') },
        { key: 'priority', label: t('board.bulkOps.priority') },
        { key: 'completed', label: t('board.bulkOps.completed') },
        { key: 'progress', label: t('board.bulkOps.progress') },
      ],
    });
    groups.push({
      type: 'group',
      label: t('board.bulkGroups.checklist'),
      children: [{ key: 'checklist', label: t('board.bulkOps.checklist') }],
    });
  }

  if (canAssignLabels) {
    groups.push({
      type: 'group',
      label: t('board.bulkGroups.labels'),
      children: [
        { key: 'addLabels', label: t('board.bulkOps.addLabels') },
        { key: 'removeLabels', label: t('board.bulkOps.removeLabels') },
        { key: 'setLabels', label: t('board.bulkOps.setLabels') },
      ],
    });
  }

  if (canDeleteTasks) {
    groups.push({
      type: 'group',
      label: t('board.bulkGroups.danger'),
      children: [
        {
          key: 'delete',
          label: t('board.bulkOps.delete'),
          danger: true,
        },
      ],
    });
  }

  const items: MenuProps['items'] = [
    ...groups,
    { type: 'divider' },
    { key: 'export', label: t('board.bulkOps.export') },
    { key: 'exportText', label: t('board.bulkOps.exportText') },
  ];

  return (
    <Dropdown
      menu={{
        items,
        selectable: true,
        selectedKeys: activeMode ? [activeMode] : [],
        onClick: ({ key }) => onSelect(key as BulkOperationMode),
        className: 'min-w-[220px]',
        style: {
          maxHeight: 'calc(100dvh - 250px)',
          overflowY: 'auto',
        },
      }}
      styles={{
        root: {
          maxHeight: 'calc(100dvh - 250px)',
          overflowY: 'auto',
          boxShadow:
            '0 10px 28px rgba(15, 23, 42, 0.10), 0 2px 8px rgba(15, 23, 42, 0.06)',
        },
      }}
      trigger={['click']}
      disabled={disabled}
    >
      <Button
        type="button"
        variant={activeMode ? 'primary' : 'secondary'}
        disabled={disabled}
        className="rounded-xl"
        aria-label={t('board.operations')}
      >
        <SlidersIcon className="me-2 h-4 w-4" />
        {activeMode ? t(`board.bulkOps.${activeMode}`) : t('board.operations')}
      </Button>
    </Dropdown>
  );
}
