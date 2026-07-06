'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ProjectSocketEvent } from '@/features/projects/types/socket';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { useProjectSocket } from '@/features/projects/hooks/useProjectSocket';
import { getApiErrorMessage } from '@/lib/api';
import { projectGroupService } from '../services/project-group.service';
import type { ProjectGroupMessage } from '../types';

interface UseProjectGroupOptions {
  enabled: boolean;
}

function sortMessagesChronologically(messages: ProjectGroupMessage[]) {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function prependUniqueMessages(
  existing: ProjectGroupMessage[],
  older: ProjectGroupMessage[],
) {
  const existingIds = new Set(existing.map((message) => message.id));
  const uniqueOlder = older.filter((message) => !existingIds.has(message.id));
  return sortMessagesChronologically([...uniqueOlder, ...existing]);
}

function appendUniqueMessage(
  existing: ProjectGroupMessage[],
  message: ProjectGroupMessage,
) {
  if (existing.some((item) => item.id === message.id)) {
    return existing;
  }
  return [...existing, message];
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottomRef = useRef(true);
  const pendingScrollRestoreRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);
  const { markProjectNotificationsRead } = useNotifications();

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      120
    );
  }, []);

  const preserveScrollPosition = useCallback(
    (previousScrollHeight: number, previousScrollTop: number) => {
      const container = messagesContainerRef.current;
      if (!container) return;

      container.scrollTop =
        container.scrollHeight - previousScrollHeight + previousScrollTop;
    },
    [],
  );

  const loadMessages = useCallback(
    async (pageNum = 1, append = false) => {
      if (!projectId || !enabled) return;

      const container = messagesContainerRef.current;
      const previousScrollHeight =
        append && container ? container.scrollHeight : 0;
      const previousScrollTop = append && container ? container.scrollTop : 0;

      if (append) {
        shouldScrollToBottomRef.current = false;
        setIsLoadingMore(true);
      } else {
        shouldScrollToBottomRef.current = true;
        setIsLoading(true);
      }
      setError('');

      try {
        const result = await projectGroupService.list(projectId, pageNum, 30);
        setMessages((prev) =>
          append
            ? prependUniqueMessages(prev, result.items)
            : sortMessagesChronologically(result.items),
        );
        setPage(result.pagination.page);
        setHasMore(result.pagination.page < result.pagination.totalPages);

        if (append) {
          pendingScrollRestoreRef.current = {
            scrollHeight: previousScrollHeight,
            scrollTop: previousScrollTop,
          };
        }
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [projectId, enabled, preserveScrollPosition],
  );

  useEffect(() => {
    if (!enabled) {
      setMessages([]);
      shouldScrollToBottomRef.current = true;
      return;
    }
    void loadMessages(1, false);
  }, [enabled, loadMessages]);

  useEffect(() => {
    if (!enabled || !projectId || isLoading) return;
    void markProjectNotificationsRead(projectId, 'GROUP_MESSAGE');
  }, [
    enabled,
    isLoading,
    markProjectNotificationsRead,
    messages,
    projectId,
  ]);

  useEffect(() => {
    if (isLoading || messages.length === 0) return;
    if (!shouldScrollToBottomRef.current) return;

    scrollToBottom('smooth');
  }, [isLoading, messages.length, scrollToBottom]);

  useLayoutEffect(() => {
    const pending = pendingScrollRestoreRef.current;
    if (!pending) return;

    pendingScrollRestoreRef.current = null;
    preserveScrollPosition(pending.scrollHeight, pending.scrollTop);
  }, [messages, preserveScrollPosition]);

  const handleRemoteChange = useCallback(
    (event: ProjectSocketEvent) => {
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
        const shouldScroll = isNearBottom();
        setMessages((prev) => appendUniqueMessage(prev, payload.message!));
        if (shouldScroll) {
          requestAnimationFrame(() => scrollToBottom());
        }
        return;
      }

      if (event.type === 'group:message:updated' && payload.message) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.message!.id ? payload.message! : m,
          ),
        );
        return;
      }

      if (event.type === 'group:message:deleted' && payload.messageId) {
        setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
      }
    },
    [isNearBottom, scrollToBottom],
  );

  useProjectSocket(projectId ?? '', { onRemoteChange: handleRemoteChange });

  const sendMessage = useCallback(
    async (content: string) => {
      if (!projectId) return null;
      const message = await projectGroupService.send(projectId, { content });
      setMessages((prev) => appendUniqueMessage(prev, message));
      shouldScrollToBottomRef.current = true;
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
      setMessages((prev) => appendUniqueMessage(prev, message));
      shouldScrollToBottomRef.current = true;
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
    messagesContainerRef,
    sendMessage,
    uploadFile,
    updateMessage,
    deleteMessage,
    loadMore,
    reload: () => loadMessages(1, false),
  };
}
