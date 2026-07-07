'use client';

import type { BoardColumn } from '@/features/board/types';
import {
  PRIORITY_OPTIONS,
  getPriorityStyles,
  type TaskPriority,
} from '@/features/tasks/types';
import { useLocale } from '@/i18n/LocaleProvider';
import { SelectField } from '@/shared/components/ui/SelectField';
import {
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

  const labelClass = isModal
    ? 'text-xs font-medium uppercase tracking-wide text-gray-400'
    : 'text-xs font-medium uppercase tracking-wide text-gray-400';

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
        />

        <SelectField
          label={<span className={labelClass}>{t('tasks.dueDate')}</span>}
          value={filters.dueDate}
          onChange={(value) =>
            onChange({
              ...filters,
              dueDate: value as TaskFilters['dueDate'],
            })
          }
          options={dueDateOptions}
        />
      </div>
    </div>
  );
}
