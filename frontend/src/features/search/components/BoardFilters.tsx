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

interface BoardFiltersProps {
  columns: BoardColumn[];
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
}

export function BoardFilters({
  columns,
  filters,
  onChange,
}: BoardFiltersProps) {
  const assignees = extractBoardAssignees(columns);
  const activeCount = countActiveFilters(filters);
  const isActive = isTaskFiltersActive(filters);

  const handlePriorityToggle = (priority: TaskPriority) => {
    onChange(togglePriorityFilter(filters, priority));
  };

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-900">Filters</p>
        {isActive && (
          <button
            type="button"
            onClick={() => onChange(defaultTaskFilters)}
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Clear filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Priority
        </p>
        <div className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((priority) => {
            const selected = filters.priorities.includes(priority);
            const style = priorityStyles[priority];
            return (
              <button
                key={priority}
                type="button"
                onClick={() => handlePriorityToggle(priority)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
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

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Assignee
          </span>
          <select
            value={filters.assigneeId ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              onChange({
                ...filters,
                assigneeId: value === '' ? null : value,
              });
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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

        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Due date
          </span>
          <select
            value={filters.dueDate}
            onChange={(event) =>
              onChange({
                ...filters,
                dueDate: event.target.value as TaskFilters['dueDate'],
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
