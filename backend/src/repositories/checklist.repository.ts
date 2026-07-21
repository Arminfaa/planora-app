import { BaseRepository } from './base.repository';
import { DEFAULT_CHECKLIST_WEIGHT } from '../utils/checklist-progress';

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

  async create(
    taskId: string,
    title: string,
    position: number,
    weight = DEFAULT_CHECKLIST_WEIGHT,
  ) {
    return this.db.taskChecklistItem.create({
      data: { taskId, title, position, weight },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      isDone?: boolean;
      completedAt?: Date | null;
      weight?: number;
      position?: number;
    },
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

  async markAllDone(taskId: string, completedAt = new Date()): Promise<void> {
    await this.db.taskChecklistItem.updateMany({
      where: { taskId, isDone: false },
      data: { isDone: true, completedAt },
    });
  }
}

export const checklistRepository = new ChecklistRepository();
