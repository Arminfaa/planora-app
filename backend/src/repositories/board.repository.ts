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

  async update(id: string, data: Prisma.BoardUpdateInput): Promise<Board> {
    return this.db.board.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.board.delete({ where: { id } });
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
