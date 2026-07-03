'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { boardService } from '../services/board.service';
import type { Board } from '../types';
import { columnsFingerprint } from '../utils/applyRealtimeEvent';
import { getApiErrorMessage } from '@/lib/api';

export function useBoard(boardId: string) {
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const lastFingerprintRef = useRef('');

  const refetch = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsLoading(true);
      }
      setError('');
      try {
        const data = await boardService.getById(boardId);
        const fingerprint = columnsFingerprint(data.columns ?? []);

        setBoard(data);
        if (fingerprint !== lastFingerprintRef.current) {
          lastFingerprintRef.current = fingerprint;
          setRevision((value) => value + 1);
        }
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        if (!options?.silent) {
          setIsLoading(false);
        }
      }
    },
    [boardId],
  );

  const applyBoardData = useCallback((data: Board) => {
    const fingerprint = columnsFingerprint(data.columns ?? []);
    lastFingerprintRef.current = fingerprint;
    setBoard(data);
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { board, isLoading, error, refetch, revision, applyBoardData };
}
