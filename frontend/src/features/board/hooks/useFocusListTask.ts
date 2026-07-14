'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const HIGHLIGHT_MS = 1800;
const MAX_FIND_ATTEMPTS = 40;

/**
 * After a modal closes (body scroll unlock restores window.scrollY),
 * smoothly scroll to a list row and briefly highlight it.
 */
export function useFocusListTask() {
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(
    null,
  );
  const highlightTimerRef = useRef<number | null>(null);

  const clearHighlightTimer = useCallback(() => {
    if (highlightTimerRef.current != null) {
      window.clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
  }, []);

  const requestFocusTask = useCallback((taskId: string) => {
    setPendingTaskId(taskId);
  }, []);

  useEffect(() => {
    if (!pendingTaskId) return;

    let cancelled = false;
    let attempts = 0;
    let frameId = 0;
    const taskId = pendingTaskId;

    const findAndFocus = () => {
      if (cancelled) return;

      const element = document.querySelector<HTMLElement>(
        `[data-task-id="${CSS.escape(taskId)}"]`,
      );

      if (!element) {
        if (attempts < MAX_FIND_ATTEMPTS) {
          attempts += 1;
          frameId = window.requestAnimationFrame(findAndFocus);
        } else {
          setPendingTaskId(null);
        }
        return;
      }

      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });

      setHighlightedTaskId(taskId);
      setPendingTaskId(null);

      clearHighlightTimer();
      highlightTimerRef.current = window.setTimeout(() => {
        setHighlightedTaskId((current) =>
          current === taskId ? null : current,
        );
        highlightTimerRef.current = null;
      }, HIGHLIGHT_MS);
    };

    // Wait two frames so modal unlock + list paint settle first.
    frameId = window.requestAnimationFrame(() => {
      frameId = window.requestAnimationFrame(findAndFocus);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [clearHighlightTimer, pendingTaskId]);

  useEffect(() => clearHighlightTimer, [clearHighlightTimer]);

  return {
    requestFocusTask,
    highlightedTaskId,
  };
}
