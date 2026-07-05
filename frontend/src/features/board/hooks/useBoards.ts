'use client';

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage, isForbiddenError } from '@/lib/api';
import { queryKeys, STALE_TIME } from '@/lib/query-keys';
import { boardService } from '../services/board.service';
import type { Board, CreateBoardInput, UpdateBoardInput } from '../types';
import { useProjectSocket } from '@/features/projects/hooks/useProjectSocket';
import { applyProjectBoardEvent } from '@/features/projects/utils/applyProjectBoardEvent';
import type { ProjectSocketEvent } from '@/features/projects/types/socket';

export function useBoards(projectId: string | null, canViewBoards = true) {
  const queryClient = useQueryClient();
  const enabled = Boolean(projectId && canViewBoards);
  const boardsKey = queryKeys.projects.boards(projectId ?? '');

  const query = useQuery({
    queryKey: boardsKey,
    queryFn: () => boardService.listByProject(projectId!),
    enabled,
    staleTime: STALE_TIME.boards,
  });

  const applyRemoteUpdate = useCallback(
    (event: ProjectSocketEvent) => {
      if (!projectId) return;
      queryClient.setQueryData<Board[]>(boardsKey, (prev) =>
        applyProjectBoardEvent(prev ?? [], event),
      );
    },
    [boardsKey, projectId, queryClient],
  );

  const { isConnected, isJoined, lastRemoteUpdate } = useProjectSocket(
    projectId ?? '',
    { onRemoteChange: applyRemoteUpdate },
  );

  const invalidateBoards = useCallback(() => {
    if (!projectId) return Promise.resolve();
    return queryClient.invalidateQueries({ queryKey: boardsKey });
  }, [boardsKey, projectId, queryClient]);

  const invalidateProgress = useCallback(() => {
    if (!projectId) return;
    void queryClient.invalidateQueries({
      queryKey: queryKeys.projects.progress(projectId),
    });
  }, [projectId, queryClient]);

  const createMutation = useMutation({
    mutationFn: (input: CreateBoardInput) =>
      boardService.create(projectId!, input),
    onSuccess: async () => {
      await invalidateBoards();
      invalidateProgress();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      boardId,
      input,
    }: {
      boardId: string;
      input: UpdateBoardInput;
    }) => boardService.update(boardId, input),
    onSuccess: () => invalidateBoards(),
  });

  const deleteMutation = useMutation({
    mutationFn: (boardId: string) => boardService.delete(boardId),
    onSuccess: async () => {
      await invalidateBoards();
      invalidateProgress();
    },
  });

  const createBoard = useCallback(
    async (input: CreateBoardInput) => {
      if (!projectId) return;
      return createMutation.mutateAsync(input);
    },
    [createMutation, projectId],
  );

  const updateBoard = useCallback(
    async (boardId: string, input: UpdateBoardInput) => {
      return updateMutation.mutateAsync({ boardId, input });
    },
    [updateMutation],
  );

  const deleteBoard = useCallback(
    async (boardId: string) => {
      await deleteMutation.mutateAsync(boardId);
    },
    [deleteMutation],
  );

  const error =
    query.error && !isForbiddenError(query.error)
      ? getApiErrorMessage(query.error)
      : '';

  return {
    boards: enabled ? (query.data ?? []) : [],
    isLoading: enabled && query.isLoading,
    error,
    refetch: query.refetch,
    createBoard,
    updateBoard,
    deleteBoard,
    isConnected,
    isJoined,
    lastRemoteUpdate,
  };
}
