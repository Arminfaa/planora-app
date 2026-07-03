import type { Label, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class LabelRepository extends BaseRepository {
  async findByProject(projectId: string): Promise<Label[]> {
    return this.db.label.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.db.label.findUnique({ where: { id } });
  }

  async findByProjectAndName(projectId: string, name: string) {
    return this.db.label.findFirst({
      where: { projectId, name },
    });
  }

  async create(data: {
    name: string;
    color: string;
    projectId: string;
  }): Promise<Label> {
    return this.db.label.create({ data });
  }

  async update(id: string, data: Prisma.LabelUpdateInput): Promise<Label> {
    return this.db.label.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await tx.taskLabel.deleteMany({ where: { labelId: id } });
      await tx.label.delete({ where: { id } });
    });
  }

  async assignToTask(taskId: string, labelId: string) {
    return this.db.taskLabel.create({
      data: { taskId, labelId },
      include: { label: true },
    });
  }

  async removeFromTask(taskId: string, labelId: string): Promise<void> {
    await this.db.taskLabel.deleteMany({
      where: { taskId, labelId },
    });
  }

  async findTaskLabel(taskId: string, labelId: string) {
    return this.db.taskLabel.findFirst({
      where: { taskId, labelId },
    });
  }
}

export const labelRepository = new LabelRepository();
