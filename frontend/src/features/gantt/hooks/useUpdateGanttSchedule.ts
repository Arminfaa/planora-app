'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import type { Board } from '@/features/board/types';
import {
  patchBoardTaskDatesInCache,
  patchBoardTaskInCache,
} from '@/features/board/utils/patchBoardTaskInCache';
import { taskService } from '@/features/tasks/services/task.service';
import { getApiErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { ProjectGanttData } from '../types';

export function useUpdateGanttSchedule(
  projectIdOrSlug: string | null,
  projectSlug: string | null,
) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const ganttKey = queryKeys.projects.gantt(projectIdOrSlug ?? '');

  const mutation = useMutation({
    mutationFn: ({
      taskId,
      schedule,
    }: {
      taskId: string;
      boardSlug: string;
      schedule: { startDate: string; dueDate: string };
    }) =>
      taskService.update(taskId, {
        startDate: schedule.startDate,
        dueDate: schedule.dueDate,
      }),
    onMutate: async ({ taskId, boardSlug, schedule }) => {
      await queryClient.cancelQueries({ queryKey: ganttKey });

      const previousGantt =
        queryClient.getQueryData<ProjectGanttData>(ganttKey);
      if (previousGantt) {
        queryClient.setQueryData<ProjectGanttData>(ganttKey, {
          scheduled: previousGantt.scheduled.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  startDate: schedule.startDate,
                  dueDate: schedule.dueDate,
                }
              : task,
          ),
          unscheduled: previousGantt.unscheduled,
        });
      }

      let previousBoard: Board | undefined;
      if (projectSlug) {
        const boardKey = queryKeys.boards.bySlug(projectSlug, boardSlug);
        previousBoard = queryClient.getQueryData(boardKey);
        patchBoardTaskDatesInCache(
          queryClient,
          projectSlug,
          boardSlug,
          taskId,
          schedule,
        );
      }

      return { previousGantt, previousBoard, boardSlug };
    },
    onSuccess: (updatedTask, { boardSlug }) => {
      if (projectSlug) {
        patchBoardTaskInCache(queryClient, projectSlug, boardSlug, updatedTask);
      }
    },
    onError: (error, { boardSlug }, context) => {
      if (context?.previousGantt) {
        queryClient.setQueryData(ganttKey, context.previousGantt);
      }
      if (context?.previousBoard && projectSlug) {
        queryClient.setQueryData(
          queryKeys.boards.bySlug(projectSlug, boardSlug),
          context.previousBoard,
        );
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
      boardSlug: string,
    ) => {
      await mutation.mutateAsync({ taskId, boardSlug, schedule });
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
