import type { GanttZoom } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

export const GANTT_DAY_WIDTH: Record<GanttZoom, number> = {
  day: 48,
  week: 28,
  month: 12,
};

export function getDayWidth(zoom: GanttZoom): number {
  return GANTT_DAY_WIDTH[zoom];
}

export function getTimelinePixelWidth(
  dayCount: number,
  zoom: GanttZoom,
): number {
  return dayCount * getDayWidth(zoom);
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getTaskScheduleBounds(task: {
  startDate: string | null;
  dueDate: string | null;
}): { start: Date; end: Date } | null {
  if (task.startDate && task.dueDate) {
    return {
      start: startOfDay(new Date(task.startDate)),
      end: startOfDay(new Date(task.dueDate)),
    };
  }

  if (task.dueDate) {
    const end = startOfDay(new Date(task.dueDate));
    return { start: addDays(end, -1), end };
  }

  if (task.startDate) {
    const start = startOfDay(new Date(task.startDate));
    return { start, end: addDays(start, 1) };
  }

  return null;
}

export function buildTimelineRange(
  tasks: Array<{ startDate: string | null; dueDate: string | null }>,
): { start: Date; end: Date } {
  const today = startOfDay(new Date());
  let start = addDays(today, -7);
  let end = addDays(today, 21);

  for (const task of tasks) {
    const bounds = getTaskScheduleBounds(task);
    if (!bounds) continue;
    if (bounds.start.getTime() < start.getTime()) start = bounds.start;
    if (bounds.end.getTime() > end.getTime()) end = bounds.end;
  }

  return { start, end: addDays(end, 2) };
}

export function getTimelineDayCount(range: { start: Date; end: Date }): number {
  return Math.max(
    1,
    Math.round((range.end.getTime() - range.start.getTime()) / DAY_MS) + 1,
  );
}

export function getBarDayOffsets(
  bounds: { start: Date; end: Date },
  range: { start: Date; end: Date },
): { startOffset: number; spanDays: number } {
  const totalDays = getTimelineDayCount(range);
  const startOffset = Math.max(
    0,
    Math.round((bounds.start.getTime() - range.start.getTime()) / DAY_MS),
  );
  const endOffset = Math.min(
    totalDays - 1,
    Math.round((bounds.end.getTime() - range.start.getTime()) / DAY_MS),
  );
  const spanDays = Math.max(1, endOffset - startOffset + 1);

  return { startOffset, spanDays };
}

export function getBarLayout(
  bounds: { start: Date; end: Date },
  range: { start: Date; end: Date },
  dayWidth: number,
): { leftPx: number; widthPx: number } {
  const { startOffset, spanDays } = getBarDayOffsets(bounds, range);

  return {
    leftPx: startOffset * dayWidth,
    widthPx: Math.max(spanDays * dayWidth, 32),
  };
}

export function buildTimelineLabels(
  range: { start: Date; end: Date },
  zoom: GanttZoom,
  dayWidth: number,
): Array<{ label: string; leftPx: number }> {
  const totalDays = getTimelineDayCount(range);
  const labels: Array<{ label: string; leftPx: number }> = [];

  if (zoom === 'month') {
    const cursor = new Date(
      range.start.getFullYear(),
      range.start.getMonth(),
      1,
    );
    while (cursor.getTime() <= range.end.getTime()) {
      const offset = Math.max(
        0,
        Math.round(
          (startOfDay(cursor).getTime() - range.start.getTime()) / DAY_MS,
        ),
      );
      labels.push({
        label: cursor.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        leftPx: offset * dayWidth,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return labels;
  }

  const step = zoom === 'week' ? 7 : 1;
  for (let offset = 0; offset < totalDays; offset += step) {
    const date = addDays(range.start, offset);
    labels.push({
      label:
        zoom === 'week'
          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : date.toLocaleDateString('en-US', {
              weekday: 'short',
              day: 'numeric',
            }),
      leftPx: offset * dayWidth,
    });
  }

  return labels;
}

export function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function moveBoundsByDays(
  bounds: { start: Date; end: Date },
  dayDelta: number,
): { start: Date; end: Date } {
  return {
    start: addDays(bounds.start, dayDelta),
    end: addDays(bounds.end, dayDelta),
  };
}

export function resizeBoundsStart(
  bounds: { start: Date; end: Date },
  dayDelta: number,
): { start: Date; end: Date } {
  const nextStart = addDays(bounds.start, dayDelta);
  if (nextStart.getTime() > bounds.end.getTime()) {
    return { start: bounds.end, end: bounds.end };
  }
  return { start: nextStart, end: bounds.end };
}

export function resizeBoundsEnd(
  bounds: { start: Date; end: Date },
  dayDelta: number,
): { start: Date; end: Date } {
  const nextEnd = addDays(bounds.end, dayDelta);
  if (nextEnd.getTime() < bounds.start.getTime()) {
    return { start: bounds.start, end: bounds.start };
  }
  return { start: bounds.start, end: nextEnd };
}

export function boundsToScheduleDates(bounds: { start: Date; end: Date }): {
  startDate: string;
  dueDate: string;
} {
  return {
    startDate: formatDateForApi(bounds.start),
    dueDate: formatDateForApi(bounds.end),
  };
}

export function pixelsToDayDelta(pixelDelta: number, dayWidth: number): number {
  if (dayWidth <= 0) return 0;
  return Math.round(pixelDelta / dayWidth);
}
