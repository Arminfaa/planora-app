'use client';

import type { BoardColumn } from '@/features/board/types';
import {
  PRIORITY_OPTIONS,
  priorityStyles,
  type TaskPriority,
} from '@/features/tasks/types';
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

  const selectClass = isModal
    ? 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20'
    : 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

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
        <label className="space-y-1.5">
          <span className={labelClass}>Assignee</span>
          <select
            value={filters.assigneeId ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              onChange({
                ...filters,
                assigneeId: value === '' ? null : value,
              });
            }}
            className={selectClass}
          >
            <option value="">All assignees</option>
            <option value={UNASSIGNED_ASSIGNEE}>Unassigned</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className={labelClass}>Due date</span>
          <select
            value={filters.dueDate}
            onChange={(event) =>
              onChange({
                ...filters,
                dueDate: event.target.value as TaskFilters['dueDate'],
              })
            }
            className={selectClass}
          >
            {DUE_DATE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
