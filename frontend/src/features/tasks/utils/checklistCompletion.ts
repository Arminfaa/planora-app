import type { BoardTask } from '@/features/board/types';
import type { TaskChecklistItem } from '../types';
import type { CompleteDateFilter, TaskFilters } from '@/features/search/types/filter';

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

function endOfMonth(date = new Date()): Date {
  const value = startOfDay(date);
  value.setMonth(value.getMonth() + 1, 0);
  return endOfDay(value);
}

function parseApiDayStart(value: string): Date {
  return startOfDay(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function parseApiDayEnd(value: string): Date {
  return endOfDay(new Date(`${value.slice(0, 10)}T00:00:00`));
}

export function matchesCompletionTimestamp(
  value: string | null | undefined,
  completeDate: CompleteDateFilter,
  from: string | null,
  to: string | null,
): boolean {
  if (completeDate === 'all') return true;

  if (completeDate === 'range') {
    if (!from && !to) return true;
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    if (from && date < parseApiDayStart(from)) return false;
    if (to && date > parseApiDayEnd(to)) return false;
    return true;
  }

  if (!value) {
    return completeDate === 'none';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  switch (completeDate) {
    case 'none':
      return false;
    case 'today':
      return date >= todayStart && date <= todayEnd;
    case 'week':
      return date >= todayStart && date <= endOfWeek();
    case 'month':
      return date >= todayStart && date <= endOfMonth();
    default:
      return true;
  }
}

export function getCompletedChecklistItems(
  task: BoardTask,
  filters?: Pick<
    TaskFilters,
    'completeDate' | 'completeDateFrom' | 'completeDateTo'
  >,
): TaskChecklistItem[] {
  const doneItems = (task.checklistItems ?? []).filter((item) => item.isDone);
  if (!filters || filters.completeDate === 'all') {
    return doneItems;
  }

  return doneItems.filter((item) =>
    matchesCompletionTimestamp(
      item.completedAt ?? null,
      filters.completeDate,
      filters.completeDateFrom,
      filters.completeDateTo,
    ),
  );
}

export function taskHasMatchingChecklistCompletion(
  task: BoardTask,
  filters: TaskFilters,
): boolean {
  if (!filters.includeChecklistCompletions) return false;
  return getCompletedChecklistItems(task, filters).length > 0;
}
