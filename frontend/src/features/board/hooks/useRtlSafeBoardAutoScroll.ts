'use client';

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useDndMonitor } from '@dnd-kit/core';

const DEFAULT_THRESHOLD = 0.12;
const DEFAULT_ACCELERATION = 12;
const INTERVAL_MS = 5;

type DragRect = {
  left: number;
  right: number;
};

/**
 * dnd-kit's built-in auto-scroll assumes LTR scrollLeft bounds (0…max).
 * In RTL, modern browsers use negative scrollLeft (0 at inline-start / right,
 * -max at inline-end / left), so `isLeft` stays true and left-edge scrolling
 * never runs. This hook scrolls `.kanban-board-scroll` with correct RTL edges.
 */
function getHorizontalScrollAvailability(element: HTMLElement) {
  const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth);
  if (maxScroll <= 0) {
    return { canScrollTowardLeft: false, canScrollTowardRight: false };
  }

  const { scrollLeft } = element;
  const isRtl = getComputedStyle(element).direction === 'rtl';

  if (!isRtl) {
    return {
      canScrollTowardLeft: scrollLeft > 0,
      canScrollTowardRight: scrollLeft < maxScroll - 1,
    };
  }

  // Negative scrollLeft model (Chrome, Safari, modern Firefox)
  if (scrollLeft < 0) {
    return {
      canScrollTowardLeft: scrollLeft > -maxScroll + 1,
      canScrollTowardRight: scrollLeft < -1,
    };
  }

  // At inline-start (scrollLeft === 0), or legacy positive RTL (0…max from start→end)
  if (scrollLeft === 0) {
    return {
      canScrollTowardLeft: true,
      canScrollTowardRight: false,
    };
  }

  return {
    canScrollTowardLeft: scrollLeft < maxScroll - 1,
    canScrollTowardRight: scrollLeft > 1,
  };
}

function scrollBoardForDragRect(
  element: HTMLElement,
  dragRect: DragRect,
  thresholdRatio: number,
  acceleration: number,
) {
  const containerRect = element.getBoundingClientRect();
  const thresholdWidth = containerRect.width * thresholdRatio;
  if (thresholdWidth <= 0) return;

  const { canScrollTowardLeft, canScrollTowardRight } =
    getHorizontalScrollAvailability(element);

  if (
    canScrollTowardRight &&
    dragRect.right >= containerRect.right - thresholdWidth
  ) {
    const distance = Math.min(
      thresholdWidth,
      dragRect.right - (containerRect.right - thresholdWidth),
    );
    const speed = acceleration * Math.max(0.2, distance / thresholdWidth);
    element.scrollBy(speed, 0);
    return;
  }

  if (
    canScrollTowardLeft &&
    dragRect.left <= containerRect.left + thresholdWidth
  ) {
    const distance = Math.min(
      thresholdWidth,
      containerRect.left + thresholdWidth - dragRect.left,
    );
    const speed = acceleration * Math.max(0.2, distance / thresholdWidth);
    element.scrollBy(-speed, 0);
  }
}

export function useRtlSafeBoardAutoScroll(
  scrollRef: RefObject<HTMLElement | null>,
  options?: { threshold?: number; acceleration?: number },
) {
  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
  const acceleration = options?.acceleration ?? DEFAULT_ACCELERATION;
  const dragRectRef = useRef<DragRect | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = () => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    dragRectRef.current = null;
  };

  const tick = () => {
    const element = scrollRef.current;
    const dragRect = dragRectRef.current;
    if (!element || !dragRect) return;
    scrollBoardForDragRect(element, dragRect, threshold, acceleration);
  };

  useDndMonitor({
    onDragStart(event) {
      const initial = event.active.rect.current.initial;
      if (initial) {
        dragRectRef.current = {
          left: initial.left,
          right: initial.right,
        };
      }
      if (intervalRef.current == null) {
        intervalRef.current = setInterval(tick, INTERVAL_MS);
      }
    },
    onDragMove(event) {
      const translated = event.active.rect.current.translated;
      if (translated) {
        dragRectRef.current = {
          left: translated.left,
          right: translated.right,
        };
      }
    },
    onDragEnd: clear,
    onDragCancel: clear,
  });

  useEffect(() => clear, []);
}
