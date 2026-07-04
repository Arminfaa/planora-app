import type { BoardColumn } from '../types';

export const COLUMN_TASK_DROP_PREFIX = 'task-drop-';

export function getColumnTaskDropId(columnId: string): string {
  return `${COLUMN_TASK_DROP_PREFIX}${columnId}`;
}

function findColumnByTaskId(
  columns: BoardColumn[],
  taskId: string,
): BoardColumn | undefined {
  return columns.find((col) => col.tasks?.some((task) => task.id === taskId));
}

function findColumnById(
  columns: BoardColumn[],
  columnId: string,
): BoardColumn | undefined {
  return columns.find((col) => col.id === columnId);
}

export function resolveColumnIdFromOver(
  columns: BoardColumn[],
  overId: string,
): string | null {
  if (overId.startsWith(COLUMN_TASK_DROP_PREFIX)) {
    return overId.slice(COLUMN_TASK_DROP_PREFIX.length);
  }

  if (findColumnById(columns, overId)) {
    return overId;
  }

  return findColumnByTaskId(columns, overId)?.id ?? null;
}

export function findColumnFromOver(
  columns: BoardColumn[],
  overId: string,
): BoardColumn | undefined {
  const columnId = resolveColumnIdFromOver(columns, overId);
  return columnId ? findColumnById(columns, columnId) : undefined;
}
