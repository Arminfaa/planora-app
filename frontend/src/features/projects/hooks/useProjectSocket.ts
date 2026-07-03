'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  connectSocket,
  isSocketConnected,
  subscribeToProject,
} from '@/lib/socket';
import type { ProjectSocketEvent } from '../types/socket';

interface UseProjectSocketOptions {
  onRemoteChange: (event: ProjectSocketEvent) => void;
}

export function useProjectSocket(
  projectId: string,
  { onRemoteChange }: UseProjectSocketOptions,
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
    if (!isAuthenticated || !projectId) return;

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

    const handleProjectEvent = (event: ProjectSocketEvent) => {
      if (event.projectId !== projectId) return;
      if (event.userId === userIdRef.current) return;

      setLastRemoteUpdate(new Date());
      onRemoteChangeRef.current(event);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    setIsConnected(isSocketConnected());

    const unsubscribe = subscribeToProject(
      projectId,
      handleProjectEvent,
      (joined) => setIsJoined(joined),
    );

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      unsubscribe();
      setIsJoined(false);
    };
  }, [projectId, isAuthenticated]);

  return { isConnected, isJoined, lastRemoteUpdate };
}
