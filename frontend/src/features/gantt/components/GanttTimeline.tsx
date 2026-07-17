'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
import { useLocale } from '@/i18n/LocaleProvider';
import { cn } from '@/lib/utils';

const TASK_COLUMN_WIDTH = '16rem';
const VIRTUALIZE_ROW_THRESHOLD = 40;

type FlatGanttRow =
  | {
      kind: 'board';
      key: string;
      boardName: string;
      height: number;
    }
  | {
      kind: 'task';
      key: string;
      task: GanttTask;
      depth: number;
      hasChildren: boolean;
      height: number;
    };

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
  const { t } = useLocale();
  const [zoom, setZoom] = useState<GanttZoom>('week');
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<Set<string>>(
    () => new Set(),
  );
  const bodyScrollRef = useRef<HTMLDivElement | null>(null);
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

  const flatRows = useMemo<FlatGanttRow[]>(() => {
    const rows: FlatGanttRow[] = [];

    for (const group of groupedRows) {
      rows.push({
        kind: 'board',
        key: `board-${group.boardSlug}`,
        boardName: group.boardName,
        height: GANTT_ROW_METRICS.boardHeader,
      });

      for (const { task, depth, hasChildren } of group.tasks) {
        if (!getTaskScheduleBounds(task)) continue;
        rows.push({
          kind: 'task',
          key: task.id,
          task,
          depth,
          hasChildren,
          height: GANTT_ROW_METRICS.taskRow,
        });
      }
    }

    return rows;
  }, [groupedRows]);

  const rowLayouts = useMemo(
    () => buildGanttTaskRowLayouts(groupedRows, range, dayWidth),
    [groupedRows, range, dayWidth],
  );
  const bodyHeight = useMemo(
    () => getTimelineBodyHeight(groupedRows),
    [groupedRows],
  );

  const shouldVirtualize = flatRows.length >= VIRTUALIZE_ROW_THRESHOLD;
  // TanStack Virtual returns unstable function identities; React Compiler skips memoization.
  // eslint-disable-next-line react-hooks/incompatible-library -- intentional list virtualization
  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? flatRows.length : 0,
    getScrollElement: () => bodyScrollRef.current,
    estimateSize: (index) => flatRows[index]?.height ?? GANTT_ROW_METRICS.taskRow,
    overscan: 10,
  });

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

  const renderRow = (row: FlatGanttRow) => {
    if (row.kind === 'board') {
      return (
        <div
          className="grid border-b border-gray-100 bg-gray-50/70"
          style={{ gridTemplateColumns, height: row.height }}
        >
          <div className="sticky start-0 z-20 border-e border-gray-100 bg-gray-50/70 px-4 py-2 text-sm font-semibold text-gray-800">
            {row.boardName}
          </div>
          <div className="border-s border-gray-100" />
        </div>
      );
    }

    const { task, depth, hasChildren } = row;
    const taskHref = `/dashboard/projects/${projectSlug}/boards/${task.boardSlug}?task=${task.slug}`;
    const isCollapsed = collapsedTaskIds.has(task.id);

    return (
      <div
        className="grid border-b border-gray-100 last:border-b-0"
        style={{ gridTemplateColumns, height: row.height }}
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
                    ? t('gantt.expandSubtasks')
                    : t('gantt.collapseSubtasks')
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
  };

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

          <div
            ref={bodyScrollRef}
            className="relative max-h-[70vh] overflow-y-auto"
          >
            {shouldVirtualize ? (
              <div
                className="relative"
                style={{ height: `${virtualizer.getTotalSize()}px` }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const row = flatRows[virtualItem.index];
                  if (!row) return null;

                  return (
                    <div
                      key={virtualItem.key}
                      className="absolute start-0 top-0 w-full"
                      style={{
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      {renderRow(row)}
                    </div>
                  );
                })}

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
            ) : (
              <>
                {flatRows.map((row) => (
                  <div key={row.key}>{renderRow(row)}</div>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
