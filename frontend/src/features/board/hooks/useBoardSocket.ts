'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  connectSocket,
  isSocketConnected,
  subscribeToBoard,
} from '@/lib/socket';
import type { BoardSocketEvent } from '../types/socket';

interface UseBoardSocketOptions {
  onRemoteChange: (event: BoardSocketEvent) => void;
}

export function useBoardSocket(
  boardId: string,
  { onRemoteChange }: UseBoardSocketOptions,
) {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [lastRemoteUpdate, setLastRemoteUpdate] = useState<Date | null>(null);

  const onRemoteChangeRef = useRef(onRemoteChange);
  const userIdRef = useRef(user?.id);

  useEffect(() => {
    onRemoteChangeRef.current = onRemoteChange;
  }, [onRemoteChange]);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !boardId) return;

    const socket = connectSocket();
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      setIsJoined(false);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setIsJoined(false);
    };

    const handleBoardEvent = (event: BoardSocketEvent) => {
      if (event.boardId !== boardId) return;
      if (event.userId === userIdRef.current) return;

      setLastRemoteUpdate(new Date());
      onRemoteChangeRef.current(event);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    setIsConnected(isSocketConnected());

    const unsubscribe = subscribeToBoard(boardId, handleBoardEvent, (joined) =>
      setIsJoined(joined),
    );

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      unsubscribe();
      setIsJoined(false);
    };
  }, [boardId, isAuthenticated]);

  return { isConnected, isJoined, lastRemoteUpdate };
}
