import { ApiError } from '../utils/ApiError';
import { buildPagination } from '../utils/pagination';
import { boardRepository } from '../repositories/board.repository';
import { projectAccessService } from './project-access.service';
import { searchRepository } from '../repositories/search.repository';

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
    query: string,
    page: number,
    limit: number,
    options?: { projectId?: string; boardId?: string },
  ) {
    if (options?.boardId) {
      const projectId = await boardRepository.getProjectId(options.boardId);
      if (!projectId) {
        throw new ApiError(404, 'Board not found');
      }
      await projectAccessService.ensureMember(userId, projectId);
    } else if (options?.projectId) {
      await projectAccessService.ensureMember(userId, options.projectId);
    }

    const [tasks, projects] = await Promise.all([
      searchRepository.searchTasks(userId, query, page, limit, options),
      options?.boardId
        ? Promise.resolve({ items: [], total: 0 })
        : searchRepository.searchProjects(userId, query, page, limit),
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
