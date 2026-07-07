import type { QueryClient } from '@tanstack/react-query';
import type { BoardTask } from '@/features/board/types';
import { queryKeys } from '@/lib/query-keys';
import type { GanttTask, ProjectGanttData } from '../types';

function applyBoardTaskFields(existing: GanttTask, task: BoardTask): GanttTask {
  return {
    ...existing,
    title: task.title,
    priority: task.priority,
    startDate: task.startDate ?? null,
    dueDate: task.dueDate ?? null,
    progress: task.isCompleted
      ? 100
      : (task.progress ?? existing.progress ?? 0),
    isCompleted: Boolean(task.isCompleted),
    parentTaskId: task.parentTaskId ?? null,
    columnId: task.columnId,
  };
}

function hasSchedule(task: Pick<BoardTask, 'startDate' | 'dueDate'>): boolean {
  return Boolean(task.startDate || task.dueDate);
}

export function patchGanttTaskFromBoardTask(
  queryClient: QueryClient,
  projectIdOrSlug: string,
  task: BoardTask,
): boolean {
  const ganttKey = queryKeys.projects.gantt(projectIdOrSlug);
  let found = false;

  queryClient.setQueryData<ProjectGanttData>(ganttKey, (prev) => {
    if (!prev) return prev;

    const scheduledIndex = prev.scheduled.findIndex(
      (item) => item.id === task.id,
    );
    const unscheduledIndex = prev.unscheduled.findIndex(
      (item) => item.id === task.id,
    );

    if (scheduledIndex === -1 && unscheduledIndex === -1) {
      return prev;
    }

    found = true;
    const scheduled = [...prev.scheduled];
    const unscheduled = [...prev.unscheduled];

    if (hasSchedule(task)) {
      if (scheduledIndex >= 0) {
        scheduled[scheduledIndex] = applyBoardTaskFields(
          scheduled[scheduledIndex],
          task,
        );
      } else if (unscheduledIndex >= 0) {
        scheduled.push(
          applyBoardTaskFields(unscheduled[unscheduledIndex], task),
        );
      }

      return {
        scheduled,
        unscheduled: unscheduled.filter((item) => item.id !== task.id),
        dependencies: prev.dependencies,
      };
    }

    if (unscheduledIndex >= 0) {
      unscheduled[unscheduledIndex] = applyBoardTaskFields(
        unscheduled[unscheduledIndex],
        task,
      );
    } else if (scheduledIndex >= 0) {
      unscheduled.push(applyBoardTaskFields(scheduled[scheduledIndex], task));
    }

    return {
      scheduled: scheduled.filter((item) => item.id !== task.id),
      unscheduled,
      dependencies: prev.dependencies,
    };
  });

  return found;
}

export function removeGanttTaskFromCache(
  queryClient: QueryClient,
  projectIdOrSlug: string,
  taskId: string,
): void {
  const ganttKey = queryKeys.projects.gantt(projectIdOrSlug);

  queryClient.setQueryData<ProjectGanttData>(ganttKey, (prev) => {
    if (!prev) return prev;

    return {
      scheduled: prev.scheduled.filter((task) => task.id !== taskId),
      unscheduled: prev.unscheduled.filter((task) => task.id !== taskId),
      dependencies: prev.dependencies.filter(
        (dependency) =>
          dependency.fromTaskId !== taskId && dependency.toTaskId !== taskId,
      ),
    };
  });
}
