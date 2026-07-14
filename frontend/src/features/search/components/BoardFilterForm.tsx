'use client';

import type { BoardColumn } from '@/features/board/types';
import {
  PRIORITY_OPTIONS,
  getPriorityStyles,
  type TaskPriority,
} from '@/features/tasks/types';
import { useLocale } from '@/i18n/LocaleProvider';
import { DateRangeInput } from '@/shared/components/ui/DateRangeInput';
import { SelectField } from '@/shared/components/ui/SelectField';
import {
  getCompleteDateFilterOptions,
  getCompletionFilterOptions,
  getDueDateFilterOptions,
  UNASSIGNED_ASSIGNEE,
  type TaskFilters,
  defaultTaskFilters,
} from '../types/filter';
import {
  countActiveFilters,
  extractBoardAssignees,
  isTaskFiltersActive,
  togglePriorityFilter,
} from '../utils/taskFilters';

interface BoardFilterFormProps {
  columns: BoardColumn[];
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  variant?: 'default' | 'modal';
}

export function BoardFilterForm({
  columns,
  filters,
  onChange,
  variant = 'default',
}: BoardFilterFormProps) {
  const { t } = useLocale();
  const assignees = extractBoardAssignees(columns);
  const activeCount = countActiveFilters(filters);
  const isActive = isTaskFiltersActive(filters);
  const isModal = variant === 'modal';
  const priorityStyles = getPriorityStyles(t);

  const handlePriorityToggle = (priority: TaskPriority) => {
    onChange(togglePriorityFilter(filters, priority));
  };

  const labelClass =
    'text-xs font-medium uppercase tracking-wide text-gray-400';

  const columnOptions = [
    { value: '', label: t('search.anyColumn') },
    ...columns.map((column) => ({ value: column.id, label: column.name })),
  ];

  const assigneeOptions = [
    { value: '', label: t('search.anyAssignee') },
    { value: UNASSIGNED_ASSIGNEE, label: t('tasks.unassigned') },
    ...assignees.map((assignee) => ({
      value: assignee.id,
      label: assignee.name,
    })),
  ];

  const dueDateOptions = getDueDateFilterOptions(t).map((option) => ({
    value: option.value,
    label: option.label,
  }));

  const completionOptions = getCompletionFilterOptions(t).map((option) => ({
    value: option.value,
    label: option.label,
  }));

  const completeDateOptions = getCompleteDateFilterOptions(t).map((option) => ({
    value: option.value,
    label: option.label,
  }));

  return (
    <div className={isModal ? 'space-y-5' : 'space-y-3'}>
      {isActive && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onChange(defaultTaskFilters)}
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            {activeCount > 0
              ? t('search.clearAllWithCount', { count: activeCount })
              : t('search.clearFilters')}
          </button>
        </div>
      )}

      <div className="space-y-2">
        <p className={labelClass}>{t('tasks.priority')}</p>
        <div className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((priority) => {
            const selected = filters.priorities.includes(priority);
            const style = priorityStyles[priority];
            return (
              <button
                key={priority}
                type="button"
                onClick={() => handlePriorityToggle(priority)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  selected
                    ? style.badge
                    : 'border border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                }`}
              >
                {style.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <SelectField
            label={<span className={labelClass}>{t('tasks.column')}</span>}
            value={filters.columnId ?? ''}
            onChange={(value) =>
              onChange({
                ...filters,
                columnId: value === '' ? null : value,
              })
            }
            options={columnOptions}
            popupMatchSelectWidth
            className="min-w-0 max-w-full"
          />
        </div>

        <SelectField
          label={<span className={labelClass}>{t('tasks.assignee')}</span>}
          value={filters.assigneeId ?? ''}
          onChange={(value) =>
            onChange({
              ...filters,
              assigneeId: value === '' ? null : value,
            })
          }
          options={assigneeOptions}
          popupMatchSelectWidth
          className="min-w-0 max-w-full"
        />

        <SelectField
          label={<span className={labelClass}>{t('common.status')}</span>}
          value={filters.completion}
          onChange={(value) =>
            onChange({
              ...filters,
              completion: value as TaskFilters['completion'],
            })
          }
          options={completionOptions}
        />

        <SelectField
          label={<span className={labelClass}>{t('tasks.dueDate')}</span>}
          value={filters.dueDate}
          onChange={(value) => {
            const dueDate = value as TaskFilters['dueDate'];
            onChange({
              ...filters,
              dueDate,
              ...(dueDate === 'range'
                ? {}
                : { dueDateFrom: null, dueDateTo: null }),
            });
          }}
          options={dueDateOptions}
        />

        <SelectField
          label={<span className={labelClass}>{t('tasks.completeDate')}</span>}
          value={filters.completeDate}
          onChange={(value) => {
            const completeDate = value as TaskFilters['completeDate'];
            onChange({
              ...filters,
              completeDate,
              ...(completeDate === 'range'
                ? {}
                : { completeDateFrom: null, completeDateTo: null }),
            });
          }}
          options={completeDateOptions}
        />

        {filters.dueDate === 'range' && (
          <div className="sm:col-span-2">
            <DateRangeInput
              label={
                <span className={labelClass}>{t('search.dueDateRange')}</span>
              }
              valueFrom={filters.dueDateFrom}
              valueTo={filters.dueDateTo}
              onChange={({ from, to }) =>
                onChange({
                  ...filters,
                  dueDate: 'range',
                  dueDateFrom: from || null,
                  dueDateTo: to || null,
                })
              }
            />
          </div>
        )}

        {filters.completeDate === 'range' && (
          <div className="sm:col-span-2">
            <DateRangeInput
              label={
                <span className={labelClass}>
                  {t('search.completeDateRange')}
                </span>
              }
              valueFrom={filters.completeDateFrom}
              valueTo={filters.completeDateTo}
              onChange={({ from, to }) =>
                onChange({
                  ...filters,
                  completeDate: 'range',
                  completeDateFrom: from || null,
                  completeDateTo: to || null,
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
