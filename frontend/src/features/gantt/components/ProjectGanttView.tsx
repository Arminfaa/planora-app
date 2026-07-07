'use client';

import Link from 'next/link';
import { useProjectPermissions } from '@/features/permissions/hooks/useProjectPermissions';
import { useProjectContext } from '@/features/projects/context/ProjectContext';
import { useProjectGantt } from '../hooks/useProjectGantt';
import { useUpdateGanttSchedule } from '../hooks/useUpdateGanttSchedule';
import { GanttTimeline } from './GanttTimeline';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { getApiErrorMessage } from '@/lib/api';

export function ProjectGanttView() {
  const { project, slug } = useProjectContext();
  const { can } = useProjectPermissions(project);
  const canViewTasks = can('task.view');
  const canEditTasks = can('task.edit');
  const { data, isLoading, error } = useProjectGantt(project.id, canViewTasks);
  const { updateSchedule, savingTaskId } = useUpdateGanttSchedule(
    project.id,
    slug,
  );

  if (!canViewTasks) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-500">
            You do not have permission to view the project timeline.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(error)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Gantt timeline</h2>
        <p className="mt-1 text-sm text-gray-500">
          Track scheduled work across all boards. Tasks appear here when they
          have a start date, a due date, or both.
          {canEditTasks && ' Drag and resize bars to update dates.'}
        </p>
      </div>

      <GanttTimeline
        tasks={data.scheduled}
        projectSlug={slug}
        canEdit={canEditTasks}
        savingTaskId={savingTaskId}
        onScheduleChange={updateSchedule}
      />

      {data.unscheduled.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">
            Unscheduled tasks
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            These tasks do not have a start date or due date yet.
          </p>
          <div className="mt-4 divide-y divide-gray-100">
            {data.unscheduled.map((task) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/projects/${slug}/boards/${task.boardSlug}?task=${task.slug}`}
                    className="truncate text-sm font-medium text-gray-900 hover:text-primary-700"
                  >
                    {task.title}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {task.boardName} · {task.columnName}
                  </p>
                </div>
                <span className="text-xs text-gray-400">No dates set</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
