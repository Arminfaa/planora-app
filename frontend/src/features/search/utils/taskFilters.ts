import type { BoardColumn, BoardTask } from '@/features/board/types';
import type { TaskPriority } from '@/features/tasks/types';
import { getTaskAssignees } from '@/features/tasks/types';
import {
  type BoardAssigneeOption,
  type TaskFilters,
  UNASSIGNED_ASSIGNEE,
  defaultTaskFilters,
} from '../types/filter';

function startOfDay(date = new Date()): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date = new Date()): Date {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function endOfWeek(date = new Date()): Date {
  const value = startOfDay(date);
  const day = value.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  value.setDate(value.getDate() + daysUntilSunday);
  return endOfDay(value);
}

export function isTaskFiltersActive(
  filters: TaskFilters = defaultTaskFilters,
): boolean {
  return (
    filters.priorities.length > 0 ||
    filters.assigneeId !== null ||
    filters.dueDate !== 'all' ||
    filters.columnId !== null
  );
}

export function taskMatchesFilters(
  task: BoardTask,
  filters: TaskFilters,
): boolean {
  if (
    filters.priorities.length > 0 &&
    !filters.priorities.includes(task.priority)
  ) {
    return false;
  }

  if (filters.assigneeId === UNASSIGNED_ASSIGNEE) {
    if (getTaskAssignees(task).length > 0) return false;
  } else if (
    filters.assigneeId &&
    !getTaskAssignees(task).some(
      (assignee) => assignee.id === filters.assigneeId,
    )
  ) {
    return false;
  }

  if (filters.columnId && task.columnId !== filters.columnId) {
    return false;
  }

  if (filters.dueDate === 'all') return true;

  if (!task.dueDate) {
    return filters.dueDate === 'none';
  }

  const due = new Date(task.dueDate);
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  switch (filters.dueDate) {
    case 'none':
      return false;
    case 'overdue':
      return due < todayStart;
    case 'today':
      return due >= todayStart && due <= todayEnd;
    case 'week':
      return due >= todayStart && due <= endOfWeek();
    default:
      return true;
  }
}

export function taskMatchesQuery(task: BoardTask, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const title = task.title.toLowerCase();
  const description = (task.description ?? '').toLowerCase();
  const assigneeNames = getTaskAssignees(task)
    .map((assignee) => assignee.name.toLowerCase())
    .join(' ');

  return (
    title.includes(normalized) ||
    description.includes(normalized) ||
    assigneeNames.includes(normalized)
  );
}

export function taskIsVisible(
  task: BoardTask,
  query: string,
  filters: TaskFilters,
): boolean {
  return taskMatchesQuery(task, query) && taskMatchesFilters(task, filters);
}

export function extractBoardAssignees(
  columns: BoardColumn[],
): BoardAssigneeOption[] {
  const map = new Map<string, BoardAssigneeOption>();

  for (const column of columns) {
    for (const task of column.tasks ?? []) {
      for (const assignee of getTaskAssignees(task)) {
        if (!map.has(assignee.id)) {
          map.set(assignee.id, {
            id: assignee.id,
            name: assignee.name,
          });
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function togglePriorityFilter(
  filters: TaskFilters,
  priority: TaskPriority,
): TaskFilters {
  const exists = filters.priorities.includes(priority);
  return {
    ...filters,
    priorities: exists
      ? filters.priorities.filter((item) => item !== priority)
      : [...filters.priorities, priority],
  };
}

export function countActiveFilters(filters: TaskFilters): number {
  let count = filters.priorities.length > 0 ? 1 : 0;
  if (filters.assigneeId !== null) count += 1;
  if (filters.dueDate !== 'all') count += 1;
  if (filters.columnId !== null) count += 1;
  return count;
}
