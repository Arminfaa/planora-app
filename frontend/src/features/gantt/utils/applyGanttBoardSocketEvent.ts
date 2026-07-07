import type { QueryClient } from '@tanstack/react-query';
import type { Board, BoardTask } from '@/features/board/types';
import type { BoardSocketEvent } from '@/features/board/types/socket';
import { applyRealtimeEvent } from '@/features/board/utils/applyRealtimeEvent';
import { queryKeys } from '@/lib/query-keys';
import {
  patchGanttTaskFromBoardTask,
  removeGanttTaskFromCache,
} from './patchGanttTaskInCache';

function resolveBoardSlug(
  queryClient: QueryClient,
  projectId: string,
  boardId: string,
): string | null {
  const boards = queryClient.getQueryData<Board[]>(
    queryKeys.projects.boards(projectId),
  );

  return boards?.find((board) => board.id === boardId)?.slug ?? null;
}

export function applyGanttBoardSocketEvent(
  queryClient: QueryClient,
  projectId: string,
  projectSlug: string,
  event: BoardSocketEvent,
): void {
  const boardSlug = resolveBoardSlug(queryClient, projectId, event.boardId);

  if (
    boardSlug &&
    ['task:updated', 'task:created', 'task:deleted', 'task:moved'].includes(
      event.type,
    )
  ) {
    queryClient.setQueryData<Board>(
      queryKeys.boards.bySlug(projectSlug, boardSlug),
      (prev) => {
        if (!prev?.columns) return prev;
        return { ...prev, columns: applyRealtimeEvent(prev.columns, event) };
      },
    );
  }

  switch (event.type) {
    case 'task:updated':
    case 'task:created': {
      const { task } = event.payload as { task?: BoardTask };
      if (!task) break;

      const patched = patchGanttTaskFromBoardTask(queryClient, projectId, task);
      if (!patched) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.projects.gantt(projectId),
        });
      }
      break;
    }
    case 'task:deleted': {
      const { taskId } = event.payload as { taskId?: string };
      if (taskId) {
        removeGanttTaskFromCache(queryClient, projectId, taskId);
      }
      break;
    }
    case 'task:moved': {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projects.gantt(projectId),
      });
      break;
    }
  }
}
