'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Board } from '@/features/board/types';
import { applyProjectBoardEvent } from '../utils/applyProjectBoardEvent';
import type { ProjectSocketEvent } from '../types/socket';
import { queryKeys } from '@/lib/query-keys';
import { useProjectSocket } from './useProjectSocket';

export function useProjectBoardSocket(projectId: string) {
  const queryClient = useQueryClient();

  const applyRemoteUpdate = useCallback(
    (event: ProjectSocketEvent) => {
      queryClient.setQueryData<Board[]>(
        queryKeys.projects.boards(projectId),
        (prev) => applyProjectBoardEvent(prev ?? [], event),
      );
    },
    [projectId, queryClient],
  );

  return useProjectSocket(projectId, { onRemoteChange: applyRemoteUpdate });
}
