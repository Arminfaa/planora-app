'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { GanttTask, GanttZoom } from '../types';
import {
  buildTimelineLabels,
  buildTimelineRange,
  getBarLayout,
  getTaskScheduleBounds,
  getTimelineDayCount,
} from '../utils/timeline';
import { priorityStyles } from '@/features/tasks/types';
import { cn } from '@/lib/utils';

interface GanttTimelineProps {
  tasks: GanttTask[];
  projectSlug: string;
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

export function GanttTimeline({ tasks, projectSlug }: GanttTimelineProps) {
  const [zoom, setZoom] = useState<GanttZoom>('week');
  const range = useMemo(() => buildTimelineRange(tasks), [tasks]);
  const labels = useMemo(() => buildTimelineLabels(range, zoom), [range, zoom]);
  const groupedTasks = useMemo(() => groupTasksByBoard(tasks), [tasks]);
  const dayCount = getTimelineDayCount(range);

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
        No scheduled tasks yet. Add a start date or due date to tasks to see
        them on the timeline.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <p className="text-sm text-gray-600">
          {tasks.length} scheduled task{tasks.length === 1 ? '' : 's'}
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
        <div className="min-w-[960px]">
          <div className="grid grid-cols-[16rem_minmax(0,1fr)] border-b border-gray-100 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <div className="px-4 py-3">Task</div>
            <div className="relative px-4 py-3">
              <div className="relative h-5">
                {labels.map((label) => (
                  <span
                    key={`${label.label}-${label.leftPercent}`}
                    className="absolute top-0 whitespace-nowrap text-[11px] normal-case text-gray-400"
                    style={{ left: `${label.leftPercent}%` }}
                  >
                    {label.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {groupedTasks.map((group) => (
            <div key={group.boardSlug}>
              <div className="grid grid-cols-[16rem_minmax(0,1fr)] border-b border-gray-100 bg-gray-50/70">
                <div className="px-4 py-2 text-sm font-semibold text-gray-800">
                  {group.boardName}
                </div>
                <div className="border-s border-gray-100" />
              </div>

              {group.tasks.map((task) => {
                const bounds = getTaskScheduleBounds(task);
                if (!bounds) return null;

                const bar = getBarLayout(bounds, range);
                const taskHref = `/dashboard/projects/${projectSlug}/boards/${task.boardSlug}?task=${task.slug}`;

                return (
                  <div
                    key={task.id}
                    className="grid grid-cols-[16rem_minmax(0,1fr)] border-b border-gray-100 last:border-b-0"
                  >
                    <div className="px-4 py-3">
                      <Link
                        href={taskHref}
                        className="block truncate text-sm font-medium text-gray-900 hover:text-primary-700"
                      >
                        {task.title}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {task.columnName}
                      </p>
                    </div>

                    <div className="relative border-s border-gray-100 px-4 py-3">
                      <div
                        className="relative h-8 rounded-md bg-[linear-gradient(to_right,rgba(229,231,235,0.7)_1px,transparent_1px)]"
                        style={{
                          backgroundSize: `${100 / dayCount}% 100%`,
                        }}
                      >
                        <Link
                          href={taskHref}
                          title={task.title}
                          className={cn(
                            'absolute top-1/2 flex h-6 -translate-y-1/2 items-center rounded-md px-2 text-[11px] font-medium text-white shadow-sm transition hover:opacity-90',
                            priorityStyles[task.priority].badge.includes('red')
                              ? 'bg-red-500'
                              : priorityStyles[task.priority].badge.includes(
                                    'orange',
                                  )
                                ? 'bg-orange-500'
                                : priorityStyles[task.priority].badge.includes(
                                      'blue',
                                    )
                                  ? 'bg-blue-500'
                                  : 'bg-gray-500',
                            task.isCompleted && 'opacity-60 line-through',
                          )}
                          style={{
                            left: `${bar.leftPercent}%`,
                            width: `${bar.widthPercent}%`,
                            minWidth: '2rem',
                          }}
                        >
                          <span className="truncate">{task.title}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
