'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useBoards } from '@/features/board/hooks/useBoards';
import { useProjectPermissions } from '@/features/permissions/hooks/useProjectPermissions';
import { useProjectContext } from '@/features/projects/context/ProjectContext';
import { useLocale } from '@/i18n/LocaleProvider';
import { useGanttBoardRealtimeSync } from '../hooks/useGanttBoardRealtimeSync';
import { useProjectGantt } from '../hooks/useProjectGantt';
import { useUpdateGanttSchedule } from '../hooks/useUpdateGanttSchedule';
import { GanttDependencyPanel } from './GanttDependencyPanel';
import { GanttTimeline } from './GanttTimeline';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { getApiErrorMessage } from '@/lib/api';

export function ProjectGanttView() {
  const { t } = useLocale();
  const { project, slug } = useProjectContext();
  const { can } = useProjectPermissions(project);
  const canViewTasks = can('task.view');
  const canEditTasks = can('task.edit');
  const { data, isLoading, error } = useProjectGantt(project.id, canViewTasks);
  const { boards } = useBoards(project.id, canViewTasks);
  const boardIds = useMemo(() => boards.map((board) => board.id), [boards]);
  useGanttBoardRealtimeSync(project.id, slug, boardIds, canViewTasks);
  const { updateSchedule, savingTaskId } = useUpdateGanttSchedule(
    project.id,
    slug,
  );

  if (!canViewTasks) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-500">{t('gantt.noPermission')}</p>
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
        <h2 className="text-lg font-semibold text-gray-900">
          {t('gantt.title')}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {t('gantt.subtitle')}
          {canEditTasks && t('gantt.subtitleEdit')}
        </p>
      </div>

      <GanttTimeline
        tasks={data.scheduled}
        dependencies={data.dependencies}
        projectSlug={slug}
        canEdit={canEditTasks}
        savingTaskId={savingTaskId}
        onScheduleChange={updateSchedule}
      />

      <GanttDependencyPanel
        projectId={project.id}
        tasks={[...data.scheduled, ...data.unscheduled]}
        dependencies={data.dependencies}
        canEdit={canEditTasks}
      />

      {data.unscheduled.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">
            {t('gantt.unscheduled')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('gantt.unscheduledHint')}
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
                <span className="text-xs text-gray-400">
                  {t('gantt.noDatesSet')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
