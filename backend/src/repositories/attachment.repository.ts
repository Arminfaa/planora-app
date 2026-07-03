import type { Attachment, AttachmentType } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class AttachmentRepository extends BaseRepository {
  async findByTask(taskId: string): Promise<Attachment[]> {
    return this.db.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.db.attachment.findUnique({ where: { id } });
  }

  async create(data: {
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    type: AttachmentType;
    taskId: string;
    storageKey?: string;
    storageProvider?: string;
  }): Promise<Attachment> {
    return this.db.attachment.create({ data });
  }

  async delete(id: string): Promise<void> {
    await this.db.attachment.delete({ where: { id } });
  }
}

export const attachmentRepository = new AttachmentRepository();
