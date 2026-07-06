import type { Notification, NotificationType, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class NotificationRepository extends BaseRepository {
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    href: string;
    projectId?: string | null;
    boardId?: string | null;
    taskId?: string | null;
    actorId?: string | null;
  }): Promise<Notification> {
    return this.db.notification.create({ data });
  }

  async createMany(
    data: Array<{
      userId: string;
      type: NotificationType;
      title: string;
      body: string;
      href: string;
      projectId?: string | null;
      boardId?: string | null;
      taskId?: string | null;
      actorId?: string | null;
    }>,
  ): Promise<number> {
    if (data.length === 0) return 0;
    const result = await this.db.notification.createMany({ data });
    return result.count;
  }

  async findByUser(
    userId: string,
    page: number,
    limit: number,
    options?: { unreadOnly?: boolean },
  ): Promise<{ items: Notification[]; total: number }> {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(options?.unreadOnly ? { readAt: null } : {}),
    };

    const [items, total] = await Promise.all([
      this.db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          actor: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      this.db.notification.count({ where }),
    ]);

    return { items, total };
  }

  async countUnread(userId: string): Promise<number> {
    return this.db.notification.count({
      where: { userId, readAt: null },
    });
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<Notification | null> {
    return this.db.notification.findFirst({
      where: { id, userId },
    });
  }

  async markRead(id: string, userId: string): Promise<Notification | null> {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) return null;
    if (existing.readAt) return existing;

    return this.db.notification.update({
      where: { id },
      data: { readAt: new Date() },
      include: {
        actor: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.db.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  }

  async markReadByProjectAndType(
    userId: string,
    projectId: string,
    type: NotificationType,
  ): Promise<number> {
    const result = await this.db.notification.updateMany({
      where: {
        userId,
        projectId,
        type,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return result.count;
  }
}

export const notificationRepository = new NotificationRepository();
