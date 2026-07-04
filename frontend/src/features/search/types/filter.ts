import type { TaskPriority } from '@/features/tasks/types';

export type DueDateFilter = 'all' | 'overdue' | 'today' | 'week' | 'none';

export const UNASSIGNED_ASSIGNEE = '__unassigned__';

export interface TaskFilters {
  priorities: TaskPriority[];
  assigneeId: string | null;
  dueDate: DueDateFilter;
  columnId: string | null;
}

export const defaultTaskFilters: TaskFilters = {
  priorities: [],
  assigneeId: null,
  dueDate: 'all',
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
