'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProjectSocketEvent } from '@/features/projects/types/socket';
import { useProjectSocket } from '@/features/projects/hooks/useProjectSocket';
import { getApiErrorMessage } from '@/lib/api';
import { projectGroupService } from '../services/project-group.service';
import type { ProjectGroupMessage } from '../types';

interface UseProjectGroupOptions {
  enabled: boolean;
}

export function useProjectGroup(
  projectId: string | null,
  { enabled }: UseProjectGroupOptions,
) {
  const [messages, setMessages] = useState<ProjectGroupMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadMessages = useCallback(
    async (pageNum = 1, append = false) => {
      if (!projectId || !enabled) return;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError('');

      try {
        const result = await projectGroupService.list(projectId, pageNum, 30);
        setMessages((prev) =>
          append ? [...result.items, ...prev] : result.items,
        );
        setPage(result.pagination.page);
        setHasMore(result.pagination.page < result.pagination.totalPages);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [projectId, enabled],
  );

  useEffect(() => {
    if (!enabled) {
      setMessages([]);
      return;
    }
    void loadMessages(1, false);
  }, [enabled, loadMessages]);

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      scrollToBottom();
    }
  }, [isLoading, messages.length, scrollToBottom]);

  const handleRemoteChange = useCallback((event: ProjectSocketEvent) => {
    if (
      event.type !== 'group:message:created' &&
      event.type !== 'group:message:updated' &&
      event.type !== 'group:message:deleted'
    ) {
      return;
    }

    const payload = event.payload as {
      message?: ProjectGroupMessage;
      messageId?: string;
    };

    if (event.type === 'group:message:created' && payload.message) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.message!.id)) return prev;
        return [...prev, payload.message!];
      });
      return;
    }

    if (event.type === 'group:message:updated' && payload.message) {
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.message!.id ? payload.message! : m)),
      );
      return;
    }

    if (event.type === 'group:message:deleted' && payload.messageId) {
      setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
    }
  }, []);

  useProjectSocket(projectId ?? '', { onRemoteChange: handleRemoteChange });

  const sendMessage = useCallback(
    async (content: string) => {
      if (!projectId) return null;
      const message = await projectGroupService.send(projectId, { content });
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      scrollToBottom();
      return message;
    },
    [projectId, scrollToBottom],
  );

  const uploadFile = useCallback(
    async (file: File, content?: string) => {
      if (!projectId) return null;
      const message = await projectGroupService.uploadFile(
        projectId,
        file,
        content,
      );
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      scrollToBottom();
      return message;
    },
    [projectId, scrollToBottom],
  );

  const updateMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!projectId) return null;
      const message = await projectGroupService.update(projectId, messageId, {
        content,
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? message : m)),
      );
      return message;
    },
    [projectId],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!projectId) return;
      await projectGroupService.remove(projectId, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    },
    [projectId],
  );

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    void loadMessages(page + 1, true);
  }, [hasMore, isLoadingMore, loadMessages, page]);

  return {
    messages,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    messagesEndRef,
    sendMessage,
    uploadFile,
    updateMessage,
    deleteMessage,
    loadMore,
    reload: () => loadMessages(1, false),
  };
}
