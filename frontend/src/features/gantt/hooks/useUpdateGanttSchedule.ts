'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { taskService } from '@/features/tasks/services/task.service';
import { getApiErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { ProjectGanttData } from '../types';

export function useUpdateGanttSchedule(projectIdOrSlug: string | null) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const ganttKey = queryKeys.projects.gantt(projectIdOrSlug ?? '');

  const mutation = useMutation({
    mutationFn: ({
      taskId,
      schedule,
    }: {
      taskId: string;
      schedule: { startDate: string; dueDate: string };
    }) =>
      taskService.update(taskId, {
        startDate: schedule.startDate,
        dueDate: schedule.dueDate,
      }),
    onMutate: async ({ taskId, schedule }) => {
      await queryClient.cancelQueries({ queryKey: ganttKey });

      const previous = queryClient.getQueryData<ProjectGanttData>(ganttKey);
      if (previous) {
        queryClient.setQueryData<ProjectGanttData>(ganttKey, {
          scheduled: previous.scheduled.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  startDate: schedule.startDate,
                  dueDate: schedule.dueDate,
                }
              : task,
          ),
          unscheduled: previous.unscheduled,
        });
      }

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ganttKey, context.previous);
      }
      message.error(getApiErrorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ganttKey });
    },
  });

  const updateSchedule = useCallback(
    async (
      taskId: string,
      schedule: { startDate: string; dueDate: string },
    ) => {
      await mutation.mutateAsync({ taskId, schedule });
    },
    [mutation],
  );

  return {
    updateSchedule,
    savingTaskId: mutation.isPending
      ? (mutation.variables?.taskId ?? null)
      : null,
  };
}
