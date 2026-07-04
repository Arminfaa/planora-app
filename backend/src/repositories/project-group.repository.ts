import type { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

const messageInclude = {
  author: {
    select: { id: true, name: true, email: true, avatar: true },
  },
  attachments: true,
} satisfies Prisma.ProjectGroupMessageInclude;

export class ProjectGroupRepository extends BaseRepository {
  async findByProject(
    projectId: string,
    page: number,
    limit: number,
  ): Promise<{
    items: Prisma.ProjectGroupMessageGetPayload<{
      include: typeof messageInclude;
    }>[];
    total: number;
  }> {
    const where = { projectId };

    const [items, total] = await Promise.all([
      this.db.projectGroupMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: messageInclude,
      }),
      this.db.projectGroupMessage.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string) {
    return this.db.projectGroupMessage.findUnique({
      where: { id },
      include: messageInclude,
    });
  }

  async createUserMessage(data: {
    projectId: string;
    authorId: string;
    content?: string;
  }) {
    return this.db.projectGroupMessage.create({
      data: {
        projectId: data.projectId,
        authorId: data.authorId,
        type: 'USER',
        content: data.content ?? null,
      },
      include: messageInclude,
    });
  }

  async createActivityMessage(data: {
    projectId: string;
    authorId: string;
    activityType: string;
    activityData: Prisma.InputJsonValue;
  }) {
    return this.db.projectGroupMessage.create({
      data: {
        projectId: data.projectId,
        authorId: data.authorId,
        type: 'ACTIVITY',
        activityType: data.activityType,
        activityData: data.activityData,
      },
      include: messageInclude,
    });
  }

  async updateContent(id: string, content: string) {
    return this.db.projectGroupMessage.update({
      where: { id },
      data: { content, editedAt: new Date() },
      include: messageInclude,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.projectGroupMessage.delete({ where: { id } });
  }

  async createAttachment(data: {
    messageId: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    type: 'IMAGE' | 'FILE';
    storageKey?: string;
    storageProvider?: string;
  }) {
    return this.db.projectGroupAttachment.create({ data });
  }

  async findAttachmentsByMessage(messageId: string) {
    return this.db.projectGroupAttachment.findMany({ where: { messageId } });
  }
}

export const projectGroupRepository = new ProjectGroupRepository();
