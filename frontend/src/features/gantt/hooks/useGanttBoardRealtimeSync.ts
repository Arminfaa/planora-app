'use client';

import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToBoard, subscribeToProject } from '@/lib/socket';
import { applyGanttBoardSocketEvent } from '../utils/applyGanttBoardSocketEvent';
import { applyGanttProjectSocketEvent } from '../utils/applyGanttProjectSocketEvent';

export function useGanttBoardRealtimeSync(
  projectId: string | null,
  projectSlug: string | null,
  boardIds: string[],
  enabled = true,
) {
  const queryClient = useQueryClient();
  const boardIdsKey = useMemo(() => boardIds.join(','), [boardIds]);

  useEffect(() => {
    if (!enabled || !projectId || !projectSlug) {
      return;
    }

    const unsubscribes: Array<() => void> = [];

    if (boardIds.length > 0) {
      unsubscribes.push(
        ...boardIds.map((boardId) =>
          subscribeToBoard(boardId, (event) => {
            applyGanttBoardSocketEvent(
              queryClient,
              projectId,
              projectSlug,
              event,
            );
          }),
        ),
      );
    }

    unsubscribes.push(
      subscribeToProject(projectId, (event) => {
        applyGanttProjectSocketEvent(queryClient, projectId, event);
      }),
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [boardIds, boardIdsKey, enabled, projectId, projectSlug, queryClient]);
}
