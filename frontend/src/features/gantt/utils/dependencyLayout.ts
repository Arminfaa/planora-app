import type { GanttDependency, GanttTask, GanttTaskRowLayout } from '../types';
import { getBarLayout, getTaskScheduleBounds } from './timeline';

export const GANTT_ROW_METRICS = {
  header: 44,
  boardHeader: 36,
  taskRow: 56,
  timelinePaddingX: 16,
} as const;

interface TaskGroup {
  boardName: string;
  boardSlug: string;
  tasks: GanttTask[];
}

export function buildGanttTaskRowLayouts(
  groupedTasks: TaskGroup[],
  range: { start: Date; end: Date },
  dayWidth: number,
): Map<string, GanttTaskRowLayout> {
  const layouts = new Map<string, GanttTaskRowLayout>();
  let top = 0;

  for (const group of groupedTasks) {
    top += GANTT_ROW_METRICS.boardHeader;

    for (const task of group.tasks) {
      const bounds = getTaskScheduleBounds(task);
      if (!bounds) continue;

      const bar = getBarLayout(bounds, range, dayWidth);
      const centerY = top + GANTT_ROW_METRICS.taskRow / 2;

      layouts.set(task.id, {
        taskId: task.id,
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

export function getTimelineBodyHeight(groupedTasks: TaskGroup[]): number {
  const scheduledTaskCount = groupedTasks.reduce(
    (count, group) =>
      count + group.tasks.filter((task) => getTaskScheduleBounds(task)).length,
    0,
  );

  return (
    groupedTasks.length * GANTT_ROW_METRICS.boardHeader +
    scheduledTaskCount * GANTT_ROW_METRICS.taskRow
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
  dependencies: GanttDependency[],
  layouts: Map<string, GanttTaskRowLayout>,
): Array<{ id: string; path: string }> {
  const links: Array<{ id: string; path: string }> = [];

  for (const dependency of dependencies) {
    const from = layouts.get(dependency.fromTaskId);
    const to = layouts.get(dependency.toTaskId);
    if (!from || !to) continue;

    const start = {
      x: from.barLeftPx + from.barWidthPx,
      y: from.centerY,
    };
    const end = {
      x: to.barLeftPx,
      y: to.centerY,
    };

    links.push({
      id: dependency.id,
      path: buildDependencyPath(start, end),
    });
  }

  return links;
}
