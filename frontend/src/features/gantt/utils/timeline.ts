const DAY_MS = 24 * 60 * 60 * 1000;

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

export function getBarLayout(
  bounds: { start: Date; end: Date },
  range: { start: Date; end: Date },
): { leftPercent: number; widthPercent: number } {
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

  return {
    leftPercent: (startOffset / totalDays) * 100,
    widthPercent: (spanDays / totalDays) * 100,
  };
}

export function buildTimelineLabels(
  range: { start: Date; end: Date },
  zoom: 'day' | 'week' | 'month',
): Array<{ label: string; leftPercent: number }> {
  const totalDays = getTimelineDayCount(range);
  const labels: Array<{ label: string; leftPercent: number }> = [];

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
        leftPercent: (offset / totalDays) * 100,
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
      leftPercent: (offset / totalDays) * 100,
    });
  }

  return labels;
}
