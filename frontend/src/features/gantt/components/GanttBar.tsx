'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GanttTask } from '../types';
import {
  boundsToScheduleDates,
  getBarLayout,
  getTaskScheduleBounds,
  moveBoundsByDays,
  pixelsToDayDelta,
  resizeBoundsEnd,
  resizeBoundsStart,
} from '../utils/timeline';
import { priorityStyles } from '@/features/tasks/types';
import { cn } from '@/lib/utils';

type DragMode = 'move' | 'resize-start' | 'resize-end';

interface GanttBarProps {
  task: GanttTask;
  range: { start: Date; end: Date };
  dayWidth: number;
  canEdit: boolean;
  isSaving: boolean;
  onScheduleChange: (
    taskId: string,
    schedule: { startDate: string; dueDate: string },
    boardSlug: string,
  ) => Promise<void>;
}

function getPriorityBarClass(priority: GanttTask['priority']): string {
  const badge = priorityStyles[priority].badge;
  if (badge.includes('red')) return 'bg-red-500';
  if (badge.includes('orange')) return 'bg-orange-500';
  if (badge.includes('blue')) return 'bg-blue-500';
  return 'bg-gray-500';
}

export function GanttBar({
  task,
  range,
  dayWidth,
  canEdit,
  isSaving,
  onScheduleChange,
}: GanttBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const previewBoundsRef = useRef<{ start: Date; end: Date } | null>(null);
  const dragStateRef = useRef<{
    mode: DragMode;
    pointerId: number;
    startX: number;
    initialBounds: { start: Date; end: Date };
  } | null>(null);
  const [previewBounds, setPreviewBounds] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const baseBounds = getTaskScheduleBounds(task);
  if (!baseBounds) return null;

  const activeBounds = previewBounds ?? baseBounds;
  const bar = getBarLayout(activeBounds, range, dayWidth);

  const setPreview = useCallback(
    (bounds: { start: Date; end: Date } | null) => {
      previewBoundsRef.current = bounds;
      setPreviewBounds(bounds);
    },
    [],
  );

  const finishDrag = useCallback(
    async (nextBounds: { start: Date; end: Date } | null) => {
      dragStateRef.current = null;
      setIsDragging(false);
      setPreview(null);

      if (!nextBounds) return;

      const unchanged =
        nextBounds.start.getTime() === baseBounds.start.getTime() &&
        nextBounds.end.getTime() === baseBounds.end.getTime();
      if (unchanged) return;

      await onScheduleChange(
        task.id,
        boundsToScheduleDates(nextBounds),
        task.boardSlug,
      );
    },
    [
      baseBounds.end,
      baseBounds.start,
      onScheduleChange,
      setPreview,
      task.boardSlug,
      task.id,
    ],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;

      const dayDelta = pixelsToDayDelta(
        event.clientX - dragState.startX,
        dayWidth,
      );

      let nextBounds = dragState.initialBounds;
      if (dragState.mode === 'move') {
        nextBounds = moveBoundsByDays(dragState.initialBounds, dayDelta);
      } else if (dragState.mode === 'resize-start') {
        nextBounds = resizeBoundsStart(dragState.initialBounds, dayDelta);
      } else {
        nextBounds = resizeBoundsEnd(dragState.initialBounds, dayDelta);
      }

      setPreview(nextBounds);
    };

    const endDrag = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;

      void finishDrag(previewBoundsRef.current ?? dragState.initialBounds);
    };

    const cancelDrag = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;

      void finishDrag(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', cancelDrag);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', cancelDrag);
    };
  }, [dayWidth, finishDrag, isDragging, setPreview]);

  const handlePointerDown = (mode: DragMode) => (event: React.PointerEvent) => {
    if (!canEdit || isSaving) return;

    event.preventDefault();
    event.stopPropagation();

    dragStateRef.current = {
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      initialBounds: baseBounds,
    };
    setIsDragging(true);
  };

  return (
    <div
      ref={trackRef}
      className="relative h-8 rounded-md bg-[linear-gradient(to_right,rgba(229,231,235,0.7)_1px,transparent_1px)]"
      style={{ backgroundSize: `${dayWidth}px 100%` }}
    >
      <div
        title={task.title}
        className={cn(
          'absolute top-1/2 flex h-6 -translate-y-1/2 items-center rounded-md text-[11px] font-medium text-white shadow-sm select-none touch-none',
          getPriorityBarClass(task.priority),
          task.isCompleted && 'opacity-60 line-through',
          canEdit ? 'cursor-grab active:cursor-grabbing' : '',
          isSaving && 'opacity-70',
          isDragging && 'cursor-grabbing',
        )}
        style={{
          left: `${bar.leftPx}px`,
          width: `${bar.widthPx}px`,
          minWidth: '2rem',
        }}
        onPointerDown={canEdit ? handlePointerDown('move') : undefined}
      >
        {canEdit && (
          <span
            aria-hidden
            className="absolute inset-y-0 start-0 z-10 w-2 cursor-ew-resize rounded-s-md bg-black/10 hover:bg-black/20"
            onPointerDown={handlePointerDown('resize-start')}
          />
        )}

        <span className="pointer-events-none truncate px-2">{task.title}</span>

        {canEdit && (
          <span
            aria-hidden
            className="absolute inset-y-0 end-0 z-10 w-2 cursor-ew-resize rounded-e-md bg-black/10 hover:bg-black/20"
            onPointerDown={handlePointerDown('resize-end')}
          />
        )}
      </div>
    </div>
  );
}
