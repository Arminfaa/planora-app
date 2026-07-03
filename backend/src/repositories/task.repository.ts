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
  async findByBoardAndSlug(boardId: string, slug: string) {
    return this.db.task.findUnique({
      where: { boardId_slug: { boardId, slug } },
      include: taskInclude,
    });
  }

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
    slug: string;
    description?: string;
    columnId: string;
    boardId: string;
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

  async moveTask(
    taskId: string,
    targetColumnId: string,
    targetPosition: number,
  ) {
    const task = await this.db.task.findUnique({
      where: { id: taskId },
      select: { id: true, columnId: true },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    const sourceColumnId = task.columnId;

    await this.db.$transaction(async (tx) => {
      const reorderColumn = async (
        columnId: string,
        orderedIds: string[],
      ): Promise<void> => {
        for (let index = 0; index < orderedIds.length; index += 1) {
          await tx.task.update({
            where: { id: orderedIds[index] },
            data: { columnId, position: index },
          });
        }
      };

      const getOrderedIds = async (columnId: string): Promise<string[]> => {
        const tasks = await tx.task.findMany({
          where: { columnId },
          orderBy: { position: 'asc' },
          select: { id: true },
        });
        return tasks.map((item) => item.id);
      };

      if (sourceColumnId === targetColumnId) {
        const ids = await getOrderedIds(sourceColumnId);
        const fromIndex = ids.indexOf(taskId);
        if (fromIndex === -1) return;

        const [removed] = ids.splice(fromIndex, 1);
        const toIndex = Math.max(0, Math.min(targetPosition, ids.length));
        ids.splice(toIndex, 0, removed);

        await reorderColumn(sourceColumnId, ids);
        return;
      }

      const sourceIds = (await getOrderedIds(sourceColumnId)).filter(
        (id) => id !== taskId,
      );
      const targetIds = (await getOrderedIds(targetColumnId)).filter(
        (id) => id !== taskId,
      );
      const toIndex = Math.max(0, Math.min(targetPosition, targetIds.length));
      targetIds.splice(toIndex, 0, taskId);

      await reorderColumn(sourceColumnId, sourceIds);
      await reorderColumn(targetColumnId, targetIds);
    });

    return this.findById(taskId);
  }

  async delete(id: string): Promise<void> {
    const task = await this.db.task.findUnique({
      where: { id },
      select: { columnId: true },
    });

    if (!task) return;

    await this.db.$transaction(async (tx) => {
      await tx.task.delete({ where: { id } });

      const remaining = await tx.task.findMany({
        where: { columnId: task.columnId },
        orderBy: { position: 'asc' },
        select: { id: true },
      });

      for (let index = 0; index < remaining.length; index += 1) {
        await tx.task.update({
          where: { id: remaining[index].id },
          data: { position: index },
        });
      }
    });
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
