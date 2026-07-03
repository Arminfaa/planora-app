import { ApiError } from '../utils/ApiError';
import { buildPagination } from '../utils/pagination';
import { boardRepository } from '../repositories/board.repository';
import { projectAccessService } from './project-access.service';
import { searchRepository } from '../repositories/search.repository';
import type { TaskFilterQuery } from '../validators/filter.validator';
import { hasActiveTaskFilters } from '../utils/task-filters';

function mapTaskResult(
  task: Awaited<
    ReturnType<typeof searchRepository.searchTasks>
  >['items'][number],
) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    columnId: task.column.id,
    columnName: task.column.name,
    boardId: task.column.board.id,
    boardName: task.column.board.name,
    projectId: task.column.board.project.id,
    projectSlug: task.column.board.project.slug,
    projectName: task.column.board.project.name,
    assignee: task.assignee,
  };
}

function mapProjectResult(
  project: Awaited<
    ReturnType<typeof searchRepository.searchProjects>
  >['items'][number],
) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    slug: project.slug,
    boardCount: project._count.boards,
    memberCount: project._count.members,
  };
}

export class SearchService {
  async search(
    userId: string,
    query: string | undefined,
    page: number,
    limit: number,
    options?: {
      projectId?: string;
      boardId?: string;
      filters?: TaskFilterQuery;
    },
  ) {
    if (!query && !hasActiveTaskFilters(options?.filters)) {
      throw new ApiError(400, 'Search query or filters required');
    }

    if (options?.boardId) {
      const projectId = await boardRepository.getProjectId(options.boardId);
      if (!projectId) {
        throw new ApiError(404, 'Board not found');
      }
      await projectAccessService.ensureMember(userId, projectId);
    } else if (options?.projectId) {
      await projectAccessService.ensureMember(userId, options.projectId);
    }

    const includeProjects = !options?.boardId && (query?.length ?? 0) >= 2;

    const [tasks, projects] = await Promise.all([
      searchRepository.searchTasks(userId, query, page, limit, options),
      includeProjects
        ? searchRepository.searchProjects(userId, query!, page, limit)
        : Promise.resolve({ items: [], total: 0 }),
    ]);

    return {
      tasks: buildPagination(
        tasks.items.map(mapTaskResult),
        tasks.total,
        page,
        limit,
      ),
      projects: buildPagination(
        projects.items.map(mapProjectResult),
        projects.total,
        page,
        limit,
      ),
    };
  }
}

export const searchService = new SearchService();
