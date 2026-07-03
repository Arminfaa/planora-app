'use client';

import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api';
import { boardService } from '../services/board.service';
import type { Board, CreateBoardInput, UpdateBoardInput } from '../types';

export function useBoards(projectId: string | null) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBoards = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError('');
    try {
      const result = await boardService.listByProject(projectId);
      setBoards(result);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchBoards();
  }, [fetchBoards]);

  const createBoard = useCallback(
    async (input: CreateBoardInput) => {
      if (!projectId) return;
      const board = await boardService.create(projectId, input);
      await fetchBoards();
      return board;
    },
    [fetchBoards, projectId],
  );

  const updateBoard = useCallback(
    async (boardId: string, input: UpdateBoardInput) => {
      const board = await boardService.update(boardId, input);
      await fetchBoards();
      return board;
    },
    [fetchBoards],
  );

  const deleteBoard = useCallback(
    async (boardId: string) => {
      await boardService.delete(boardId);
      await fetchBoards();
    },
    [fetchBoards],
  );

  return {
    boards,
    isLoading,
    error,
    refetch: fetchBoards,
    createBoard,
    updateBoard,
    deleteBoard,
  };
}
