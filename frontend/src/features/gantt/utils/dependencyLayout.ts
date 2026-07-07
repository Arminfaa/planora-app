import type { GanttHierarchyRow, GanttTaskRowLayout } from '../types';
import { getTaskScheduleBounds, getBarLayout } from './timeline';

export const GANTT_ROW_METRICS = {
  header: 44,
  boardHeader: 36,
  taskRow: 56,
  timelinePaddingX: 16,
  indentPx: 16,
} as const;

interface TaskGroup {
  boardName: string;
  boardSlug: string;
  tasks: GanttHierarchyRow[];
}

export function buildGanttTaskRowLayouts(
  groupedRows: TaskGroup[],
  range: { start: Date; end: Date },
  dayWidth: number,
): Map<string, GanttTaskRowLayout> {
  const layouts = new Map<string, GanttTaskRowLayout>();
  let top = 0;

  for (const group of groupedRows) {
    top += GANTT_ROW_METRICS.boardHeader;

    for (const row of group.tasks) {
      const bounds = getTaskScheduleBounds(row.task);
      if (!bounds) continue;

      const bar = getBarLayout(bounds, range, dayWidth);
      const centerY = top + GANTT_ROW_METRICS.taskRow / 2;

      layouts.set(row.task.id, {
        taskId: row.task.id,
        top,
        centerY,
        barLeftPx: bar.leftPx + GANTT_ROW_METRICS.timelinePaddingX,
        barWidthPx: bar.widthPx,
      });

      top += GANTT_ROW_METRICS.taskRow;
    }
  }

  return layouts;
}

export function getTimelineBodyHeight(groupedRows: TaskGroup[]): number {
  const rowCount = groupedRows.reduce(
    (count, group) =>
      count +
      group.tasks.filter((row) => getTaskScheduleBounds(row.task)).length,
    0,
  );

  return (
    groupedRows.length * GANTT_ROW_METRICS.boardHeader +
    rowCount * GANTT_ROW_METRICS.taskRow
  );
}

export function buildDependencyPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
  const gap = 10;
  const elbowX = from.x + gap;

  if (Math.abs(from.y - to.y) < 1) {
    return `M ${from.x} ${from.y} H ${to.x}`;
  }

  return `M ${from.x} ${from.y} H ${elbowX} V ${to.y} H ${to.x}`;
}

export function buildDependencyLinks(
  dependencies: Array<{ id: string; fromTaskId: string; toTaskId: string }>,
  layouts: Map<
    string,
    { barLeftPx: number; barWidthPx: number; centerY: number }
  >,
): Array<{ id: string; path: string }> {
  const links: Array<{ id: string; path: string }> = [];

  for (const dependency of dependencies) {
    const from = layouts.get(dependency.fromTaskId);
    const to = layouts.get(dependency.toTaskId);
    if (!from || !to) continue;

    links.push({
      id: dependency.id,
      path: buildDependencyPath(
        { x: from.barLeftPx + from.barWidthPx, y: from.centerY },
        { x: to.barLeftPx, y: to.centerY },
      ),
    });
  }

  return links;
}
