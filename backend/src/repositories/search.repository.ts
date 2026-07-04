import type { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import type { TaskFilterQuery } from '../validators/filter.validator';
import { buildTaskFilterWhere } from '../utils/task-filters';
import { enrichTasksWithAssignees } from '../utils/task-enrichment';

const projectAccessFilter = (userId: string): Prisma.ProjectWhereInput => ({
  OR: [{ ownerId: userId }, { members: { some: { userId } } }],
});

const taskInclude = {
  column: {
    select: {
      id: true,
      name: true,
      board: {
        select: {
          id: true,
          name: true,
          slug: true,
          project: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  },
} satisfies Prisma.TaskInclude;

export class SearchRepository extends BaseRepository {
  async searchTasks(
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
    const boardFilter: Prisma.BoardWhereInput = {
      project: {
        ...projectAccessFilter(userId),
        ...(options?.projectId ? { id: options.projectId } : {}),
      },
      ...(options?.boardId ? { id: options.boardId } : {}),
    };

    const textFilter: Prisma.TaskWhereInput | undefined = query
      ? {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const attributeFilter = buildTaskFilterWhere(options?.filters);

    const where: Prisma.TaskWhereInput = {
      column: { board: boardFilter },
      ...(textFilter || Object.keys(attributeFilter).length > 0
        ? {
            AND: [textFilter, attributeFilter].filter(
              (part): part is Prisma.TaskWhereInput =>
                Boolean(part && Object.keys(part).length > 0),
            ),
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.db.task.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: taskInclude,
      }),
      this.db.task.count({ where }),
    ]);

    const enriched = await enrichTasksWithAssignees(this.db, items);

    return { items: enriched, total };
  }

  async searchProjects(
    userId: string,
    query: string,
    page: number,
    limit: number,
  ) {
    const where: Prisma.ProjectWhereInput = {
      AND: [
        projectAccessFilter(userId),
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
      ],
    };

    const [items, total] = await Promise.all([
      this.db.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { boards: true, members: true } },
        },
      }),
      this.db.project.count({ where }),
    ]);

    return { items, total };
  }

  async getAssigneeOptions(userId: string) {
    const tasks = await this.db.task.findMany({
      where: {
        NOT: { assigneeIds: { isEmpty: true } },
        column: {
          board: {
            project: projectAccessFilter(userId),
          },
        },
      },
      select: { assigneeIds: true },
    });

    const assigneeIds = [...new Set(tasks.flatMap((task) => task.assigneeIds))];

    if (assigneeIds.length === 0) {
      return [];
    }

    return this.db.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, name: true, email: true, avatar: true },
      orderBy: { name: 'asc' },
    });
  }
}

export const searchRepository = new SearchRepository();
