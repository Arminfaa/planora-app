import { BaseRepository } from './base.repository';

export class ChecklistRepository extends BaseRepository {
  async findByTask(taskId: string) {
    return this.db.taskChecklistItem.findMany({
      where: { taskId },
      orderBy: { position: 'asc' },
    });
  }

  async findById(id: string) {
    return this.db.taskChecklistItem.findUnique({ where: { id } });
  }

  async getNextPosition(taskId: string): Promise<number> {
    const last = await this.db.taskChecklistItem.findFirst({
      where: { taskId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return (last?.position ?? -1) + 1;
  }

  async create(taskId: string, title: string, position: number) {
    return this.db.taskChecklistItem.create({
      data: { taskId, title, position },
    });
  }

  async update(
    id: string,
    data: { title?: string; isDone?: boolean; position?: number },
  ) {
    return this.db.taskChecklistItem.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.taskChecklistItem.delete({ where: { id } });
  }

  async deleteByTask(taskId: string): Promise<void> {
    await this.db.taskChecklistItem.deleteMany({ where: { taskId } });
  }
}

export const checklistRepository = new ChecklistRepository();
