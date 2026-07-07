import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { Board, BoardTask } from '../types';
import { applyRealtimeEvent } from './applyRealtimeEvent';

export function patchBoardTaskInCache(
  queryClient: QueryClient,
  projectSlug: string,
  boardSlug: string,
  updatedTask: BoardTask,
): void {
  const boardKey = queryKeys.boards.bySlug(projectSlug, boardSlug);

  queryClient.setQueryData<Board>(boardKey, (prev) => {
    if (!prev?.columns) return prev;

    const nextColumns = applyRealtimeEvent(prev.columns, {
      type: 'task:updated',
      boardId: prev.id,
      userId: '',
      payload: { task: updatedTask },
    });

    return { ...prev, columns: nextColumns };
  });
}

export function patchBoardTaskDatesInCache(
  queryClient: QueryClient,
  projectSlug: string,
  boardSlug: string,
  taskId: string,
  schedule: { startDate: string; dueDate: string },
): void {
  const boardKey = queryKeys.boards.bySlug(projectSlug, boardSlug);

  queryClient.setQueryData<Board>(boardKey, (prev) => {
    if (!prev?.columns) return prev;

    let changed = false;
    const nextColumns = prev.columns.map((column) => {
      let columnChanged = false;
      const nextTasks = (column.tasks ?? []).map((task) => {
        if (task.id !== taskId) return task;
        columnChanged = true;
        return {
          ...task,
          startDate: schedule.startDate,
          dueDate: schedule.dueDate,
        };
      });

      if (columnChanged) changed = true;
      return columnChanged ? { ...column, tasks: nextTasks } : column;
    });

    if (!changed) return prev;
    return { ...prev, columns: nextColumns };
  });
}
