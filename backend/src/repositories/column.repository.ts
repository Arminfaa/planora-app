import type { Column, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class ColumnRepository extends BaseRepository {
  async findById(id: string): Promise<Column | null> {
    return this.db.column.findUnique({ where: { id } });
  }

  async create(data: {
    name: string;
    boardId: string;
    position?: number;
    color?: string;
  }): Promise<Column> {
    return this.db.column.create({ data });
  }

  async update(id: string, data: Prisma.ColumnUpdateInput): Promise<Column> {
    return this.db.column.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const tasks = await tx.task.findMany({
        where: { columnId: id },
        select: { id: true },
      });
      const taskIds = tasks.map((task) => task.id);

      if (taskIds.length) {
        await tx.taskLabel.deleteMany({ where: { taskId: { in: taskIds } } });
        await tx.comment.deleteMany({ where: { taskId: { in: taskIds } } });
        await tx.attachment.deleteMany({ where: { taskId: { in: taskIds } } });
        await tx.task.deleteMany({ where: { id: { in: taskIds } } });
      }

      await tx.column.delete({ where: { id } });
    });
  }

  async getBoardId(columnId: string): Promise<string | null> {
    const column = await this.db.column.findUnique({
      where: { id: columnId },
      select: { boardId: true },
    });
    return column?.boardId ?? null;
  }

  async findByBoardId(boardId: string): Promise<Column[]> {
    return this.db.column.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });
  }

  async reorder(boardId: string, orderedIds: string[]): Promise<Column[]> {
    await this.db.$transaction(async (tx) => {
      for (let index = 0; index < orderedIds.length; index += 1) {
        await tx.column.updateMany({
          where: { id: orderedIds[index], boardId },
          data: { position: index },
        });
      }
    });

    return this.findByBoardId(boardId);
  }
}

export const columnRepository = new ColumnRepository();
