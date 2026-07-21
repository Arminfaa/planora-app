import type { TaskPriority } from '@/features/tasks/types';

export type DueDateFilter =
  'all' | 'overdue' | 'today' | 'week' | 'none' | 'range';

export type CompletionFilter = 'all' | 'completed' | 'not_completed';

export type CompleteDateFilter =
  'all' | 'today' | 'week' | 'month' | 'none' | 'range';

export const UNASSIGNED_ASSIGNEE = '__unassigned__';

export interface TaskFilters {
  priorities: TaskPriority[];
  assigneeId: string | null;
  dueDate: DueDateFilter;
  dueDateFrom: string | null;
  dueDateTo: string | null;
  completion: CompletionFilter;
  completeDate: CompleteDateFilter;
  completeDateFrom: string | null;
  completeDateTo: string | null;
  /** When true, completion-date filters also match checklist items ticked in range. */
  includeChecklistCompletions: boolean;
  columnId: string | null;
}

export const defaultTaskFilters: TaskFilters = {
  priorities: [],
  assigneeId: null,
  dueDate: 'all',
  dueDateFrom: null,
  dueDateTo: null,
  completion: 'all',
  completeDate: 'all',
  completeDateFrom: null,
  completeDateTo: null,
  includeChecklistCompletions: true,
  columnId: null,
};

export type ApiDueDateFilter = Exclude<DueDateFilter, 'all' | 'range'>;

export interface SearchFilterParams {
  priority?: TaskPriority[];
  assigneeId?: string | 'unassigned';
  due?: ApiDueDateFilter;
}

export interface BoardAssigneeOption {
  id: string;
  name: string;
}

export function getDueDateFilterOptions(t: (key: string) => string) {
  return [
    { value: 'all' as const, label: t('search.allDueDates') },
    { value: 'overdue' as const, label: t('search.dueOverdue') },
    { value: 'today' as const, label: t('search.dueToday') },
    { value: 'week' as const, label: t('search.dueThisWeek') },
    { value: 'range' as const, label: t('search.dateRange') },
    { value: 'none' as const, label: t('search.noDueDate') },
  ];
}

export function getCompletionFilterOptions(t: (key: string) => string) {
  return [
    { value: 'all' as const, label: t('search.allCompletion') },
    { value: 'completed' as const, label: t('search.completionCompleted') },
    {
      value: 'not_completed' as const,
      label: t('search.completionNotCompleted'),
    },
  ];
}

export function getCompleteDateFilterOptions(t: (key: string) => string) {
  return [
    { value: 'all' as const, label: t('search.allCompleteDates') },
    { value: 'today' as const, label: t('search.completedToday') },
    { value: 'week' as const, label: t('search.completedThisWeek') },
    { value: 'month' as const, label: t('search.completedThisMonth') },
    { value: 'range' as const, label: t('search.dateRange') },
    { value: 'none' as const, label: t('search.noCompleteDate') },
  ];
}

/** @deprecated Use getDueDateFilterOptions(t) for translated labels */
export const DUE_DATE_FILTER_OPTIONS: {
  value: DueDateFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All due dates' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due today' },
  { value: 'week', label: 'Due this week' },
  { value: 'range', label: 'Date range' },
  { value: 'none', label: 'No due date' },
];
