'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { boardService } from '../services/board.service';
import type { Board } from '../types';
import { columnsFingerprint } from '../utils/applyRealtimeEvent';
import { getApiErrorMessage } from '@/lib/api';
import { queryKeys, STALE_TIME } from '@/lib/query-keys';

export function useBoard(projectSlug: string, boardSlug: string) {
  const queryClient = useQueryClient();
  const lastFingerprintRef = useRef('');
  const [revision, setRevision] = useState(0);

  const query = useQuery({
    queryKey: queryKeys.boards.bySlug(projectSlug, boardSlug),
    queryFn: () => boardService.getBySlug(projectSlug, boardSlug),
    enabled: Boolean(projectSlug && boardSlug),
    staleTime: STALE_TIME.boardDetail,
  });

  useEffect(() => {
    if (!query.data) return;

    const fingerprint = columnsFingerprint(query.data.columns ?? []);
    if (fingerprint !== lastFingerprintRef.current) {
      lastFingerprintRef.current = fingerprint;
      setRevision((value) => value + 1);
    }
  }, [query.data]);

  const refetch = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!projectSlug || !boardSlug) return;

      if (options?.silent) {
        await query.refetch({ cancelRefetch: false });
        return;
      }

      await query.refetch();
    },
    [boardSlug, projectSlug, query],
  );

  const applyBoardData = useCallback(
    (data: Board) => {
      queryClient.setQueryData(
        queryKeys.boards.bySlug(projectSlug, boardSlug),
        data,
      );
      const fingerprint = columnsFingerprint(data.columns ?? []);
      lastFingerprintRef.current = fingerprint;
      setRevision((value) => value + 1);
    },
    [boardSlug, projectSlug, queryClient],
  );

  return {
    board: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? getApiErrorMessage(query.error) : '',
    refetch,
    revision,
    applyBoardData,
  };
}
