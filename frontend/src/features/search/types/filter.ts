import type { TaskPriority } from '@/features/tasks/types';

export type DueDateFilter = 'all' | 'overdue' | 'today' | 'week' | 'none';

export type CompletionFilter = 'all' | 'completed' | 'not_completed';

export type CompleteDateFilter = 'all' | 'today' | 'week' | 'month' | 'none';

export type ChecklistFilter = 'all' | 'with' | 'without';

export const UNASSIGNED_ASSIGNEE = '__unassigned__';

export interface TaskFilters {
  priorities: TaskPriority[];
  assigneeId: string | null;
  dueDate: DueDateFilter;
  completion: CompletionFilter;
  completeDate: CompleteDateFilter;
  checklist: ChecklistFilter;
  columnId: string | null;
}

export const defaultTaskFilters: TaskFilters = {
  priorities: [],
  assigneeId: null,
  dueDate: 'all',
  completion: 'all',
  completeDate: 'all',
  checklist: 'all',
  columnId: null,
};

export type ApiDueDateFilter = Exclude<DueDateFilter, 'all'>;

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
    { value: 'none' as const, label: t('search.noCompleteDate') },
  ];
}

export function getChecklistFilterOptions(t: (key: string) => string) {
  return [
    { value: 'all' as const, label: t('search.allChecklist') },
    { value: 'with' as const, label: t('search.withChecklist') },
    { value: 'without' as const, label: t('search.withoutChecklist') },
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
  { value: 'none', label: 'No due date' },
];
