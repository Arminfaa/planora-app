'use client';

import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToBoard } from '@/lib/socket';
import { applyGanttBoardSocketEvent } from '../utils/applyGanttBoardSocketEvent';

export function useGanttBoardRealtimeSync(
  projectId: string | null,
  projectSlug: string | null,
  boardIds: string[],
  enabled = true,
) {
  const queryClient = useQueryClient();
  const boardIdsKey = useMemo(() => boardIds.join(','), [boardIds]);

  useEffect(() => {
    if (!enabled || !projectId || !projectSlug || boardIds.length === 0) {
      return;
    }

    const unsubscribes = boardIds.map((boardId) =>
      subscribeToBoard(boardId, (event) => {
        applyGanttBoardSocketEvent(queryClient, projectId, projectSlug, event);
      }),
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [boardIds, boardIdsKey, enabled, projectId, projectSlug, queryClient]);
}
