'use client';

import type { BoardColumn } from '@/features/board/types';
import {
  PRIORITY_OPTIONS,
  priorityStyles,
  type TaskPriority,
} from '@/features/tasks/types';
import { SelectField } from '@/shared/components/ui/SelectField';
import {
  DUE_DATE_FILTER_OPTIONS,
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
  const assignees = extractBoardAssignees(columns);
  const activeCount = countActiveFilters(filters);
  const isActive = isTaskFiltersActive(filters);
  const isModal = variant === 'modal';

  const handlePriorityToggle = (priority: TaskPriority) => {
    onChange(togglePriorityFilter(filters, priority));
  };

  const labelClass = isModal
    ? 'text-xs font-medium uppercase tracking-wide text-gray-400'
    : 'text-xs font-medium uppercase tracking-wide text-gray-400';

  const columnOptions = [
    { value: '', label: 'All columns' },
    ...columns.map((column) => ({ value: column.id, label: column.name })),
  ];

  const assigneeOptions = [
    { value: '', label: 'All assignees' },
    { value: UNASSIGNED_ASSIGNEE, label: 'Unassigned' },
    ...assignees.map((assignee) => ({
      value: assignee.id,
      label: assignee.name,
    })),
  ];

  const dueDateOptions = DUE_DATE_FILTER_OPTIONS.map((option) => ({
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
            Clear all{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        </div>
      )}

      <div className="space-y-2">
        <p className={labelClass}>Priority</p>
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
            label={<span className={labelClass}>Column</span>}
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
          label={<span className={labelClass}>Assignee</span>}
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
          label={<span className={labelClass}>Due date</span>}
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
