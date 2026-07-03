import type { TaskPriority } from '@/features/tasks/types';
import type { PaginatedData } from '@/shared/types/api';
import type { ApiDueDateFilter, SearchFilterParams } from './filter';

export type { TaskFilters, DueDateFilter, SearchFilterParams } from './filter';
export { defaultTaskFilters, UNASSIGNED_ASSIGNEE } from './filter';

export interface SearchTaskResult {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  columnId: string;
  columnName: string;
  boardId: string;
  boardName: string;
  projectId: string;
  projectSlug: string;
  projectName: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
}

export interface SearchProjectResult {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  boardCount: number;
  memberCount: number;
}

export interface SearchResponse {
  tasks: PaginatedData<SearchTaskResult>;
  projects: PaginatedData<SearchProjectResult>;
}

export interface SearchParams {
  q?: string;
  page?: number;
  limit?: number;
  projectId?: string;
  boardId?: string;
  priority?: TaskPriority[];
  assigneeId?: string;
  due?: ApiDueDateFilter;
}

export function toSearchFilterParams(
  filters: SearchFilterParams,
): Pick<SearchParams, 'priority' | 'assigneeId' | 'due'> {
  const params: Pick<SearchParams, 'priority' | 'assigneeId' | 'due'> = {};

  if (filters.priority?.length) {
    params.priority = filters.priority;
  }

  if (filters.assigneeId) {
    params.assigneeId = filters.assigneeId;
  }

  if (filters.due) {
    params.due = filters.due;
  }

  return params;
}
