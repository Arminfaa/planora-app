import type { Prisma, Task } from '@prisma/client';
import { BaseRepository } from './base.repository';

const taskInclude = {
  assignee: {
    select: { id: true, name: true, email: true, avatar: true },
  },
  createdBy: {
    select: { id: true, name: true, email: true },
  },
  labels: {
    include: { label: true },
  },
} satisfies Prisma.TaskInclude;

export class TaskRepository extends BaseRepository {
  async findById(id: string) {
    return this.db.task.findUnique({
      where: { id },
      include: taskInclude,
    });
  }

  async findByColumn(
    columnId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Task[]; total: number }> {
    const where = { columnId };

    const [items, total] = await Promise.all([
      this.db.task.findMany({
        where,
        orderBy: { position: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: taskInclude,
      }),
      this.db.task.count({ where }),
    ]);

    return { items, total };
  }

  async create(data: {
    title: string;
    description?: string;
    columnId: string;
    position?: number;
    priority?: Prisma.TaskCreateInput['priority'];
    dueDate?: Date;
    assigneeId?: string;
    createdById: string;
  }) {
    return this.db.task.create({
      data,
      include: taskInclude,
    });
  }

  async update(id: string, data: Prisma.TaskUpdateInput) {
    return this.db.task.update({
      where: { id },
      data,
      include: taskInclude,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.task.delete({ where: { id } });
  }

  async getColumnId(taskId: string): Promise<string | null> {
    const task = await this.db.task.findUnique({
      where: { id: taskId },
      select: { columnId: true },
    });
    return task?.columnId ?? null;
  }
}

export const taskRepository = new TaskRepository();
