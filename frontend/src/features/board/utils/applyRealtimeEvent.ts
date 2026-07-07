import type { BoardColumn, BoardTask } from '../types';
import type { BoardSocketEvent } from '../types/socket';

function normalizeTask(task: BoardTask): BoardTask {
  return {
    ...task,
    id: String(task.id),
    columnId: String(task.columnId),
    position: Number(task.position),
    isCompleted: Boolean(task.isCompleted),
  };
}

function findExistingTask(
  columns: BoardColumn[],
  taskId: string,
): BoardTask | undefined {
  const id = String(taskId);

  for (const column of columns) {
    const task = (column.tasks ?? []).find((item) => String(item.id) === id);
    if (task) return task;
  }

  return undefined;
}

function mergeTaskFromCache(
  incoming: BoardTask,
  existing?: BoardTask,
): BoardTask {
  if (!existing) return incoming;

  return {
    ...incoming,
    labels: incoming.labels ?? existing.labels,
    _count: incoming._count ?? existing._count,
  };
}

function removeTask(columns: BoardColumn[], taskId: string): BoardColumn[] {
  const id = String(taskId);

  return columns.map((col) => ({
    ...col,
    tasks: (col.tasks ?? []).filter((task) => String(task.id) !== id),
  }));
}

function insertTask(columns: BoardColumn[], task: BoardTask): BoardColumn[] {
  const existing = findExistingTask(columns, task.id);
  const normalized = normalizeTask(mergeTaskFromCache(task, existing));
  const cleaned = removeTask(columns, normalized.id);

  return cleaned.map((col) => {
    if (col.id !== normalized.columnId) return col;

    const tasks = [...(col.tasks ?? []), normalized].sort(
      (a, b) => a.position - b.position,
    );

    return { ...col, tasks };
  });
}

function normalizeColumn(column: BoardColumn): BoardColumn {
  return {
    ...column,
    id: String(column.id),
    boardId: String(column.boardId),
    position: Number(column.position),
    tasks: column.tasks ?? [],
  };
}

function insertColumn(
  columns: BoardColumn[],
  column: BoardColumn,
): BoardColumn[] {
  const normalized = normalizeColumn(column);
  const exists = columns.some((col) => col.id === normalized.id);
  const next = exists
    ? columns.map((col) => (col.id === normalized.id ? normalized : col))
    : [...columns, normalized];

  return next.sort((a, b) => a.position - b.position);
}

function updateColumn(
  columns: BoardColumn[],
  column: BoardColumn,
): BoardColumn[] {
  const normalized = normalizeColumn(column);

  return columns
    .map((col) =>
      col.id === normalized.id
        ? { ...col, ...normalized, tasks: col.tasks ?? [] }
        : col,
    )
    .sort((a, b) => a.position - b.position);
}

function removeColumn(columns: BoardColumn[], columnId: string): BoardColumn[] {
  const id = String(columnId);
  return columns.filter((col) => col.id !== id);
}

function normalizeColumns(columns: BoardColumn[]): BoardColumn[] {
  return columns.map((col) => ({
    ...col,
    tasks: [...(col.tasks ?? [])]
      .map(normalizeTask)
      .sort((a, b) => a.position - b.position),
  }));
}

export function applyRealtimeEvent(
  columns: BoardColumn[],
  event: BoardSocketEvent,
): BoardColumn[] {
  switch (event.type) {
    case 'task:moved': {
      const { columns: syncedColumns } = event.payload as {
        columns?: BoardColumn[];
      };
      if (syncedColumns?.length) {
        return normalizeColumns(syncedColumns);
      }
      return columns;
    }
    case 'task:created': {
      const { task } = event.payload as { task: BoardTask };
      if (!task) return columns;
      return normalizeColumns(insertTask(columns, task));
    }
    case 'task:updated': {
      const { task } = event.payload as { task: BoardTask };
      if (!task) return columns;
      return normalizeColumns(insertTask(columns, task));
    }
    case 'task:deleted': {
      const { taskId } = event.payload as { taskId: string };
      if (!taskId) return columns;
      return normalizeColumns(removeTask(columns, taskId));
    }
    case 'column:created': {
      const { column } = event.payload as { column: BoardColumn };
      if (!column) return columns;
      return normalizeColumns(insertColumn(columns, column));
    }
    case 'column:updated': {
      const { column } = event.payload as { column: BoardColumn };
      if (!column) return columns;
      return normalizeColumns(updateColumn(columns, column));
    }
    case 'column:deleted': {
      const { columnId } = event.payload as { columnId: string };
      if (!columnId) return columns;
      return normalizeColumns(removeColumn(columns, columnId));
    }
    case 'columns:reordered': {
      const { columns: syncedColumns } = event.payload as {
        columns?: BoardColumn[];
      };
      if (!syncedColumns?.length) return columns;

      const tasksByColumnId = new Map<string, BoardTask[]>(
        columns.map((col) => [col.id, col.tasks ?? []]),
      );

      const reordered = syncedColumns.map((col) => {
        const normalized = normalizeColumn(col);
        return {
          ...normalized,
          tasks: tasksByColumnId.get(normalized.id) ?? normalized.tasks ?? [],
        };
      });

      return normalizeColumns(reordered);
    }
    default:
      return columns;
  }
}

export function columnsFingerprint(columns: BoardColumn[]): string {
  return columns
    .map((col) => {
      const tasks = (col.tasks ?? [])
        .map((task) => `${task.id}:${task.columnId}:${task.position}`)
        .join(',');
      return `${col.id}:${col.position}:${col.name}[${tasks}]`;
    })
    .join('|');
}

export function columnSortableKey(column: BoardColumn): string {
  return (column.tasks ?? [])
    .map((task) => `${task.id}@${task.position}`)
    .join('|');
}
