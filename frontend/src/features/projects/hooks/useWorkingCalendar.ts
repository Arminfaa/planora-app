'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, STALE_TIME } from '@/lib/query-keys';
import { projectService } from '../services/project.service';

export function useWorkingCalendar(projectId: string | null, enabled = true) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.projects.workingCalendar(projectId ?? '');

  const query = useQuery({
    queryKey,
    queryFn: () => projectService.getWorkingCalendar(projectId!),
    enabled: Boolean(projectId) && enabled,
    staleTime: STALE_TIME.workingCalendar,
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.workingCalendar(projectId ?? ''),
      }),
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId ?? '', 'analytics', 'completions'],
      }),
    ]);
  };

  const updateWeekdays = useMutation({
    mutationFn: (nonWorkingWeekdays: number[]) =>
      projectService.updateWorkingWeekdays(projectId!, nonWorkingWeekdays),
    onSuccess: () => invalidate(),
  });

  const createHoliday = useMutation({
    mutationFn: (input: { date: string; title?: string }) =>
      projectService.createHoliday(projectId!, input),
    onSuccess: () => invalidate(),
  });

  const deleteHoliday = useMutation({
    mutationFn: (holidayId: string) =>
      projectService.deleteHoliday(projectId!, holidayId),
    onSuccess: () => invalidate(),
  });

  const createLeave = useMutation({
    mutationFn: (input: {
      userId: string;
      startDate: string;
      endDate: string;
      note?: string;
    }) => projectService.createLeave(projectId!, input),
    onSuccess: () => invalidate(),
  });

  const deleteLeave = useMutation({
    mutationFn: (leaveId: string) =>
      projectService.deleteLeave(projectId!, leaveId),
    onSuccess: () => invalidate(),
  });

  return {
    calendar: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updateWeekdays,
    createHoliday,
    deleteHoliday,
    createLeave,
    deleteLeave,
  };
}
