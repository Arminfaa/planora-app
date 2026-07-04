import type { Prisma } from '@prisma/client';
import type { TaskFilterQuery } from '../validators/filter.validator';

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

export function buildTaskFilterWhere(
  filters?: TaskFilterQuery,
): Prisma.TaskWhereInput {
  if (!filters) return {};

  const conditions: Prisma.TaskWhereInput[] = [];

  if (filters.priority?.length) {
    conditions.push({ priority: { in: filters.priority } });
  }

  if (filters.assigneeId === 'unassigned') {
    conditions.push({ assigneeIds: { isEmpty: true } });
  } else if (filters.assigneeId) {
    conditions.push({ assigneeIds: { has: filters.assigneeId } });
  }

  if (filters.due === 'none') {
    conditions.push({ dueDate: null });
  } else if (filters.due === 'overdue') {
    conditions.push({ dueDate: { lt: startOfDay() } });
  } else if (filters.due === 'today') {
    conditions.push({
      dueDate: {
        gte: startOfDay(),
        lte: endOfDay(),
      },
    });
  } else if (filters.due === 'week') {
    conditions.push({
      dueDate: {
        gte: startOfDay(),
        lte: endOfWeek(),
      },
    });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { AND: conditions };
}

export function hasActiveTaskFilters(filters?: TaskFilterQuery): boolean {
  if (!filters) return false;
  return Boolean(filters.priority?.length || filters.assigneeId || filters.due);
}
