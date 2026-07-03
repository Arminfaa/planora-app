import type { TaskPriority } from '@/features/tasks/types';
import type { PaginatedData } from '@/shared/types/api';

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
  q: string;
  page?: number;
  limit?: number;
  projectId?: string;
  boardId?: string;
}
