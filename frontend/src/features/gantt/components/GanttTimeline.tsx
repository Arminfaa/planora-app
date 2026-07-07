'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { GanttDependency, GanttTask, GanttZoom } from '../types';
import {
  buildGanttTaskRowLayouts,
  getTimelineBodyHeight,
  GANTT_ROW_METRICS,
} from '../utils/dependencyLayout';
import { buildBoardHierarchyRows } from '../utils/hierarchy';
import {
  buildTimelineLabels,
  buildTimelineRange,
  getDayWidth,
  getTaskScheduleBounds,
  getTimelineDayCount,
  getTimelinePixelWidth,
} from '../utils/timeline';
import { GanttBar } from './GanttBar';
import { GanttDependencyLayer } from './GanttDependencyLayer';
import { cn } from '@/lib/utils';

const TASK_COLUMN_WIDTH = '16rem';

interface GanttTimelineProps {
  tasks: GanttTask[];
  dependencies: GanttDependency[];
  projectSlug: string;
  canEdit: boolean;
  savingTaskId: string | null;
  onScheduleChange: (
    taskId: string,
    schedule: { startDate: string; dueDate: string },
    boardSlug: string,
  ) => Promise<void>;
}

function groupTasksByBoard(tasks: GanttTask[]) {
  const groups = new Map<
    string,
    { boardName: string; boardSlug: string; tasks: GanttTask[] }
  >();

  for (const task of tasks) {
    const existing = groups.get(task.boardId);
    if (existing) {
      existing.tasks.push(task);
      continue;
    }

    groups.set(task.boardId, {
      boardName: task.boardName,
      boardSlug: task.boardSlug,
      tasks: [task],
    });
  }

  return Array.from(groups.values());
}

export function GanttTimeline({
  tasks,
  dependencies,
  projectSlug,
  canEdit,
  savingTaskId,
  onScheduleChange,
}: GanttTimelineProps) {
  const [zoom, setZoom] = useState<GanttZoom>('week');
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<Set<string>>(
    () => new Set(),
  );
  const range = useMemo(() => buildTimelineRange(tasks), [tasks]);
  const dayCount = getTimelineDayCount(range);
  const dayWidth = getDayWidth(zoom);
  const timelineWidth = getTimelinePixelWidth(dayCount, zoom);
  const labels = useMemo(
    () => buildTimelineLabels(range, zoom, dayWidth),
    [dayWidth, range, zoom],
  );

  const groupedRows = useMemo(() => {
    return groupTasksByBoard(tasks).map((group) => ({
      ...group,
      tasks: buildBoardHierarchyRows(group.tasks, collapsedTaskIds),
    }));
  }, [collapsedTaskIds, tasks]);

  const rowLayouts = useMemo(
    () => buildGanttTaskRowLayouts(groupedRows, range, dayWidth),
    [groupedRows, range, dayWidth],
  );
  const bodyHeight = useMemo(
    () => getTimelineBodyHeight(groupedRows),
    [groupedRows],
  );

  const toggleCollapsed = (taskId: string) => {
    setCollapsedTaskIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
        No scheduled tasks yet. Add a start date or due date to tasks to see
        them on the timeline.
      </div>
    );
  }

  const gridTemplateColumns = `${TASK_COLUMN_WIDTH} ${timelineWidth}px`;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <p className="text-sm text-gray-600">
          {tasks.length} scheduled task{tasks.length === 1 ? '' : 's'}
          {dependencies.length > 0 && (
            <span className="text-gray-400">
              {' '}
              · {dependencies.length} dependenc
              {dependencies.length === 1 ? 'y' : 'ies'}
            </span>
          )}
          {canEdit && (
            <span className="text-gray-400">
              {' '}
              · Drag bars to move, edges to resize
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {(['day', 'week', 'month'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setZoom(option)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition',
                zoom === option
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="relative min-w-full"
          style={{ width: `calc(${TASK_COLUMN_WIDTH} + ${timelineWidth}px)` }}
        >
          <div
            className="grid border-b border-gray-100 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500"
            style={{ gridTemplateColumns }}
          >
            <div className="sticky start-0 z-20 border-e border-gray-100 bg-gray-50 px-4 py-3">
              Task
            </div>
            <div className="relative px-4 py-3">
              <div className="relative h-5">
                {labels.map((label) => (
                  <span
                    key={`${label.label}-${label.leftPx}`}
                    className="absolute top-0 whitespace-nowrap text-[11px] normal-case text-gray-400"
                    style={{ left: `${label.leftPx}px` }}
                  >
                    {label.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            {groupedRows.map((group) => (
              <div key={group.boardSlug}>
                <div
                  className="grid border-b border-gray-100 bg-gray-50/70"
                  style={{ gridTemplateColumns }}
                >
                  <div className="sticky start-0 z-20 border-e border-gray-100 bg-gray-50/70 px-4 py-2 text-sm font-semibold text-gray-800">
                    {group.boardName}
                  </div>
                  <div className="border-s border-gray-100" />
                </div>

                {group.tasks.map(({ task, depth, hasChildren }) => {
                  const bounds = getTaskScheduleBounds(task);
                  if (!bounds) return null;

                  const taskHref = `/dashboard/projects/${projectSlug}/boards/${task.boardSlug}?task=${task.slug}`;
                  const isCollapsed = collapsedTaskIds.has(task.id);

                  return (
                    <div
                      key={task.id}
                      className="grid border-b border-gray-100 last:border-b-0"
                      style={{ gridTemplateColumns }}
                    >
                      <div className="sticky start-0 z-20 border-e border-gray-100 bg-white px-4 py-3">
                        <div
                          className="flex items-start gap-1"
                          style={{
                            paddingInlineStart: `${depth * GANTT_ROW_METRICS.indentPx}px`,
                          }}
                        >
                          {hasChildren ? (
                            <button
                              type="button"
                              aria-label={
                                isCollapsed
                                  ? 'Expand subtasks'
                                  : 'Collapse subtasks'
                              }
                              onClick={() => toggleCollapsed(task.id)}
                              className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                            >
                              {isCollapsed ? '▶' : '▼'}
                            </button>
                          ) : (
                            <span className="inline-block h-5 w-5 shrink-0" />
                          )}

                          <div className="min-w-0">
                            <Link
                              href={taskHref}
                              className="block truncate text-sm font-medium text-gray-900 hover:text-primary-700"
                            >
                              {task.title}
                            </Link>
                            <p className="mt-0.5 truncate text-xs text-gray-500">
                              {task.columnName}
                              {task.childCount > 0
                                ? ` · ${task.childCount} subtask${task.childCount === 1 ? '' : 's'}`
                                : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="relative border-s border-gray-100 px-4 py-3">
                        <GanttBar
                          task={task}
                          range={range}
                          dayWidth={dayWidth}
                          canEdit={canEdit}
                          isSaving={savingTaskId === task.id}
                          onScheduleChange={onScheduleChange}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            <div
              className="pointer-events-none absolute top-0 z-10"
              style={{
                left: TASK_COLUMN_WIDTH,
                width: `${timelineWidth}px`,
                height: `${bodyHeight}px`,
              }}
            >
              <GanttDependencyLayer
                dependencies={dependencies}
                layouts={rowLayouts}
                width={timelineWidth}
                height={bodyHeight}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
