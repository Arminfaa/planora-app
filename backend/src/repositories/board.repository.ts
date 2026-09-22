import type { Board, Prisma } from '@prisma/client';
import { getDefaultKanbanColumnDefinitions } from '../i18n/default-columns';
import { enrichTasksWithAssignees } from '../utils/task-enrichment';
import { BaseRepository } from './base.repository';

export class BoardRepository extends BaseRepository {
  async findByProjectAndSlug(
    projectId: string,
    slug: string,
  ): Promise<Board | null> {
    return this.db.board.findUnique({
      where: { projectId_slug: { projectId, slug } },
    });
  }

  async findById(id: string) {
    const board = await this.db.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                columnId: true,
                boardId: true,
                position: true,
                priority: true,
                startDate: true,
                dueDate: true,
                completeDate: true,
                progress: true,
                parentTaskId: true,
                isCompleted: true,
                autoCompleteSuppressed: true,
                assigneeIds: true,
                createdById: true,
                createdAt: true,
                updatedAt: true,
                labels: {
                  include: { label: true },
                },
                checklistItems: {
                  orderBy: { position: 'asc' },
                  select: {
                    id: true,
                    title: true,
                    isDone: true,
                    completedAt: true,
                    weight: true,
                    position: true,
                  },
                },
                _count: {
                  select: { attachments: true, checklistItems: true },
                },
              },
            },
          },
        },
      },
    });

    if (!board) return null;

    const allTasks = board.columns.flatMap((column) => column.tasks);
    const enriched = await enrichTasksWithAssignees(this.db, allTasks);
    const enrichedById = new Map(enriched.map((task) => [task.id, task]));

    return {
      ...board,
      columns: board.columns.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) => enrichedById.get(task.id) ?? task),
      })),
    };
  }

  async findColumnSummariesByBoardId(boardId: string) {
    return this.db.column.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        name: true,
        boardId: true,
        position: true,
        color: true,
      },
    });
  }

  async findByProject(projectId: string): Promise<Board[]> {
    return this.db.board.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
      include: { _count: { select: { columns: true } } },
    });
  }

  async countTaskCompletion(boardId: string): Promise<{
    total: number;
    completed: number;
    incomplete: number;
  }> {
    const [total, completed] = await Promise.all([
      this.db.task.count({ where: { boardId } }),
      this.db.task.count({ where: { boardId, isCompleted: true } }),
    ]);

    return {
      total,
      completed,
      incomplete: total - completed,
    };
  }

  async countTaskCompletionByProject(projectId: string): Promise<
    Map<string, { total: number; completed: number; incomplete: number }>
  > {
    const boards = await this.db.board.findMany({
      where: { projectId },
      select: { id: true },
    });
    const boardIds = boards.map((board) => board.id);
    const stats = new Map<
      string,
      { total: number; completed: number; incomplete: number }
    >();

    for (const boardId of boardIds) {
      stats.set(boardId, { total: 0, completed: 0, incomplete: 0 });
    }

    if (boardIds.length === 0) return stats;

    const grouped = await this.db.task.groupBy({
      by: ['boardId', 'isCompleted'],
      where: { boardId: { in: boardIds } },
      _count: { _all: true },
    });

    for (const row of grouped) {
      const current = stats.get(row.boardId) ?? {
        total: 0,
        completed: 0,
        incomplete: 0,
      };
      const count = row._count._all;
      current.total += count;
      if (row.isCompleted) {
        current.completed += count;
      } else {
        current.incomplete += count;
      }
      stats.set(row.boardId, current);
    }

    return stats;
  }

  async findMetaById(id: string) {
    return this.db.board.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        projectId: true,
        position: true,
        color: true,
        isCompleted: true,
        backgroundUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByProjectWithColumns(projectId: string) {
    return this.db.board.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        projectId: true,
        position: true,
        columns: {
          orderBy: { position: 'asc' as const },
          select: {
            id: true,
            name: true,
            color: true,
            boardId: true,
            position: true,
          },
        },
      },
    });
  }

  async create(data: {
    name: string;
    slug: string;
    projectId: string;
    position?: number;
    color?: string | null;
    isCompleted?: boolean;
  }): Promise<Board> {
    return this.db.board.create({ data });
  }

  async createWithDefaultColumns(data: {
    name: string;
    slug: string;
    projectId: string;
    position?: number;
    color?: string | null;
    isCompleted?: boolean;
  }): Promise<Board> {
    return this.db.$transaction(async (tx) => {
      const board = await tx.board.create({ data });

      await tx.column.createMany({
        data: getDefaultKanbanColumnDefinitions().map((column) => ({
          name: column.name,
          boardId: board.id,
          position: column.position,
          color: column.color,
        })),
      });

      return board;
    });
  }

  async update(id: string, data: Prisma.BoardUpdateInput): Promise<Board> {
    return this.db.board.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const columns = await tx.column.findMany({
        where: { boardId: id },
        select: { id: true },
      });
      const columnIds = columns.map((column) => column.id);

      if (columnIds.length) {
        const tasks = await tx.task.findMany({
          where: { columnId: { in: columnIds } },
          select: { id: true },
        });
        const taskIds = tasks.map((task) => task.id);

        if (taskIds.length) {
          await tx.taskLabel.deleteMany({ where: { taskId: { in: taskIds } } });
          await tx.comment.deleteMany({ where: { taskId: { in: taskIds } } });
          await tx.attachment.deleteMany({
            where: { taskId: { in: taskIds } },
          });
          await tx.taskChecklistItem.deleteMany({
            where: { taskId: { in: taskIds } },
          });
          await tx.task.deleteMany({ where: { id: { in: taskIds } } });
        }

        await tx.column.deleteMany({ where: { id: { in: columnIds } } });
      }

      await tx.board.delete({ where: { id } });
    });
  }

  async getProjectId(boardId: string): Promise<string | null> {
    const board = await this.db.board.findUnique({
      where: { id: boardId },
      select: { projectId: true },
    });
    return board?.projectId ?? null;
  }

  async findSlugById(
    boardId: string,
  ): Promise<{ slug: string; projectId: string; name: string } | null> {
    return this.db.board.findUnique({
      where: { id: boardId },
      select: { slug: true, projectId: true, name: true },
    });
  }
}

export const boardRepository = new BoardRepository();
