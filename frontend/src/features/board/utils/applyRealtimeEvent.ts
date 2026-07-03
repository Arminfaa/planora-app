import type { BoardColumn, BoardTask } from '../types';
import type { BoardSocketEvent } from '../types/socket';

function normalizeTask(task: BoardTask): BoardTask {
  return {
    ...task,
    id: String(task.id),
    columnId: String(task.columnId),
    position: Number(task.position),
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
  const normalized = normalizeTask(task);
  const cleaned = removeTask(columns, normalized.id);

  return cleaned.map((col) => {
    if (col.id !== normalized.columnId) return col;

    const tasks = [...(col.tasks ?? []), normalized].sort(
      (a, b) => a.position - b.position,
    );

    return { ...col, tasks };
  });
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
      return `${col.id}[${tasks}]`;
    })
    .join('|');
}

export function columnSortableKey(column: BoardColumn): string {
  return (column.tasks ?? [])
    .map((task) => `${task.id}@${task.position}`)
    .join('|');
}
