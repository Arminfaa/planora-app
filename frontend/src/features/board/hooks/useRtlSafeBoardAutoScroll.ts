'use client';

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useDndMonitor } from '@dnd-kit/core';

/** Absolute edge zone in px — ratio zones fire immediately on full-width mobile cards. */
const EDGE_ZONE_PX = 44;
/** Pointer must move this far from drag-start before that direction can auto-scroll. */
const INTENT_PX = 10;
const ACCELERATION = 5;
const INTERVAL_MS = 16;

/**
 * dnd-kit's built-in auto-scroll assumes LTR scrollLeft bounds (0…max).
 * In RTL, modern browsers use negative scrollLeft (0 at inline-start / right,
 * -max at inline-end / left), so left-edge scrolling never runs.
 *
 * Uses pointer X (not the dragged card rect) plus move-intent, so activating
 * drag on a full-width mobile task does not shake the board.
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

  if (scrollLeft < 0) {
    return {
      canScrollTowardLeft: scrollLeft > -maxScroll + 1,
      canScrollTowardRight: scrollLeft < -1,
    };
  }

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

function getClientXFromEvent(event: Event): number | null {
  if ('touches' in event) {
    const touchEvent = event as TouchEvent;
    const touch = touchEvent.touches[0] ?? touchEvent.changedTouches[0];
    return touch?.clientX ?? null;
  }

  if ('clientX' in event && typeof (event as MouseEvent).clientX === 'number') {
    return (event as MouseEvent).clientX;
  }

  return null;
}

function scrollBoardForPointer(
  element: HTMLElement,
  pointerX: number,
  intentLeft: boolean,
  intentRight: boolean,
) {
  const containerRect = element.getBoundingClientRect();
  const { canScrollTowardLeft, canScrollTowardRight } =
    getHorizontalScrollAvailability(element);

  const nearLeft = pointerX <= containerRect.left + EDGE_ZONE_PX;
  const nearRight = pointerX >= containerRect.right - EDGE_ZONE_PX;

  if (nearLeft && intentLeft && canScrollTowardLeft) {
    const distance = Math.min(
      EDGE_ZONE_PX,
      containerRect.left + EDGE_ZONE_PX - pointerX,
    );
    const speed = ACCELERATION * Math.max(0.25, distance / EDGE_ZONE_PX);
    element.scrollBy(-speed, 0);
    return;
  }

  if (nearRight && intentRight && canScrollTowardRight) {
    const distance = Math.min(
      EDGE_ZONE_PX,
      pointerX - (containerRect.right - EDGE_ZONE_PX),
    );
    const speed = ACCELERATION * Math.max(0.25, distance / EDGE_ZONE_PX);
    element.scrollBy(speed, 0);
  }
}

export function useRtlSafeBoardAutoScroll(
  scrollRef: RefObject<HTMLElement | null>,
) {
  const stateRef = useRef({
    pointerX: null as number | null,
    startX: null as number | null,
    intentLeft: false,
    intentRight: false,
    listening: false,
    intervalId: null as ReturnType<typeof setInterval> | null,
  });

  const scrollRefLatest = useRef(scrollRef);
  scrollRefLatest.current = scrollRef;

  const updatePointer = (clientX: number) => {
    const state = stateRef.current;
    state.pointerX = clientX;

    if (state.startX == null) {
      state.startX = clientX;
      return;
    }

    if (clientX <= state.startX - INTENT_PX) {
      state.intentLeft = true;
    }
    if (clientX >= state.startX + INTENT_PX) {
      state.intentRight = true;
    }
  };

  const onWindowPointerMove = useRef((event: PointerEvent) => {
    updatePointer(event.clientX);
  }).current;

  const onWindowTouchMove = useRef((event: TouchEvent) => {
    const touch = event.touches[0];
    if (touch) updatePointer(touch.clientX);
  }).current;

  const tick = useRef(() => {
    const state = stateRef.current;
    const element = scrollRefLatest.current.current;
    if (!element || state.pointerX == null || state.startX == null) return;

    scrollBoardForPointer(
      element,
      state.pointerX,
      state.intentLeft,
      state.intentRight,
    );
  }).current;

  const clearPointerListeners = () => {
    const state = stateRef.current;
    if (!state.listening) return;
    state.listening = false;
    window.removeEventListener('pointermove', onWindowPointerMove);
    window.removeEventListener('touchmove', onWindowTouchMove);
  };

  const ensurePointerListeners = () => {
    const state = stateRef.current;
    if (state.listening) return;
    state.listening = true;
    window.addEventListener('pointermove', onWindowPointerMove, {
      passive: true,
    });
    window.addEventListener('touchmove', onWindowTouchMove, { passive: true });
  };

  const clear = () => {
    const state = stateRef.current;
    if (state.intervalId != null) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    clearPointerListeners();
    state.pointerX = null;
    state.startX = null;
    state.intentLeft = false;
    state.intentRight = false;
  };

  useDndMonitor({
    onDragStart(event) {
      const state = stateRef.current;
      const fromActivator = getClientXFromEvent(event.activatorEvent);
      state.startX = fromActivator;
      state.pointerX = fromActivator;
      state.intentLeft = false;
      state.intentRight = false;
      ensurePointerListeners();
      if (state.intervalId == null) {
        state.intervalId = setInterval(tick, INTERVAL_MS);
      }
    },
    onDragMove(event) {
      const state = stateRef.current;
      // Fallback when window listeners miss an update
      if (state.startX != null && event.delta) {
        updatePointer(state.startX + event.delta.x);
      }
    },
    onDragEnd: clear,
    onDragCancel: clear,
  });

  useEffect(() => () => clear(), []);
}
