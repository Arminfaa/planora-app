import type { Board, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class BoardRepository extends BaseRepository {
  async findById(id: string) {
    return this.db.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignee: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
            },
          },
        },
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

  async create(data: {
    name: string;
    projectId: string;
    position?: number;
  }): Promise<Board> {
    return this.db.board.create({ data });
  }

  async createWithDefaultColumns(data: {
    name: string;
    projectId: string;
    position?: number;
  }): Promise<Board> {
    return this.db.$transaction(async (tx) => {
      const board = await tx.board.create({ data });

      await tx.column.createMany({
        data: [
          { name: 'To Do', boardId: board.id, position: 0, color: '#6B7280' },
          {
            name: 'In Progress',
            boardId: board.id,
            position: 1,
            color: '#3B82F6',
          },
          { name: 'Done', boardId: board.id, position: 2, color: '#10B981' },
        ],
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
}

export const boardRepository = new BoardRepository();
