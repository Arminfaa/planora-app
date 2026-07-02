'use client';

import { useCallback, useEffect, useState } from 'react';
import { boardService } from '../services/board.service';
import type { Board } from '../types';
import { getApiErrorMessage } from '@/lib/api';

export function useBoard(boardId: string) {
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await boardService.getById(boardId);
      setBoard(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { board, isLoading, error, refetch, setBoard };
}
