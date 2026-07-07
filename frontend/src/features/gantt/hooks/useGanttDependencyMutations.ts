'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { getApiErrorMessage } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { taskDependencyService } from '../services/taskDependency.service';
import type { GanttDependency, ProjectGanttData } from '../types';

export function useTaskDependencies(taskId: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tasks.dependencies(taskId ?? ''),
    queryFn: () => taskDependencyService.listByTask(taskId!),
    enabled: Boolean(taskId && enabled),
    staleTime: 30_000,
  });
}

export function useGanttDependencyMutations(
  projectIdOrSlug: string | null,
  taskId?: string | null,
) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const ganttKey = queryKeys.projects.gantt(projectIdOrSlug ?? '');

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ganttKey });
    if (taskId) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.dependencies(taskId),
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: (input: { fromTaskId: string; toTaskId: string }) =>
      taskDependencyService.create(projectIdOrSlug!, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ganttKey });
      const previous = queryClient.getQueryData<ProjectGanttData>(ganttKey);

      if (previous) {
        const fromTask =
          previous.scheduled.find((task) => task.id === input.fromTaskId) ??
          previous.unscheduled.find((task) => task.id === input.fromTaskId);
        const toTask =
          previous.scheduled.find((task) => task.id === input.toTaskId) ??
          previous.unscheduled.find((task) => task.id === input.toTaskId);

        if (fromTask && toTask) {
          const optimistic: GanttDependency = {
            id: `temp-${input.fromTaskId}-${input.toTaskId}`,
            projectId: projectIdOrSlug ?? '',
            fromTaskId: input.fromTaskId,
            toTaskId: input.toTaskId,
            type: 'FINISH_TO_START',
            fromTaskTitle: fromTask.title,
            toTaskTitle: toTask.title,
            fromBoardName: fromTask.boardName,
            toBoardName: toTask.boardName,
            createdAt: new Date().toISOString(),
          };

          queryClient.setQueryData<ProjectGanttData>(ganttKey, {
            ...previous,
            dependencies: [...previous.dependencies, optimistic],
          });
        }
      }

      return { previous };
    },
    onSuccess: async () => {
      message.success('Dependency added');
      await invalidate();
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ganttKey, context.previous);
      }
      message.error(getApiErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (dependencyId: string) =>
      taskDependencyService.delete(projectIdOrSlug!, dependencyId),
    onMutate: async (dependencyId) => {
      await queryClient.cancelQueries({ queryKey: ganttKey });
      const previous = queryClient.getQueryData<ProjectGanttData>(ganttKey);

      if (previous) {
        queryClient.setQueryData<ProjectGanttData>(ganttKey, {
          ...previous,
          dependencies: previous.dependencies.filter(
            (dependency) => dependency.id !== dependencyId,
          ),
        });
      }

      return { previous };
    },
    onSuccess: async () => {
      message.success('Dependency removed');
      await invalidate();
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ganttKey, context.previous);
      }
      message.error(getApiErrorMessage(error));
    },
  });

  return {
    createDependency: createMutation.mutateAsync,
    deleteDependency: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
