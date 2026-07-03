import type { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

const commentInclude = {
  author: {
    select: { id: true, name: true, email: true, avatar: true },
  },
} satisfies Prisma.CommentInclude;

export class CommentRepository extends BaseRepository {
  async findByTask(taskId: string) {
    return this.db.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: commentInclude,
    });
  }

  async findById(id: string) {
    return this.db.comment.findUnique({
      where: { id },
      include: commentInclude,
    });
  }

  async create(data: { content: string; taskId: string; authorId: string }) {
    return this.db.comment.create({
      data,
      include: commentInclude,
    });
  }

  async update(id: string, content: string) {
    return this.db.comment.update({
      where: { id },
      data: { content },
      include: commentInclude,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.comment.delete({ where: { id } });
  }
}

export const commentRepository = new CommentRepository();
