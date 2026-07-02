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
    await this.db.column.delete({ where: { id } });
  }

  async getBoardId(columnId: string): Promise<string | null> {
    const column = await this.db.column.findUnique({
      where: { id: columnId },
      select: { boardId: true },
    });
    return column?.boardId ?? null;
  }
}

export const columnRepository = new ColumnRepository();
