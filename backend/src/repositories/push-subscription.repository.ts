import type { PushSubscription } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class PushSubscriptionRepository extends BaseRepository {
  async upsert(data: {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string | null;
  }): Promise<PushSubscription> {
    return this.db.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: data,
      update: {
        userId: data.userId,
        p256dh: data.p256dh,
        auth: data.auth,
        userAgent: data.userAgent ?? null,
      },
    });
  }

  async findByUser(userId: string): Promise<PushSubscription[]> {
    return this.db.pushSubscription.findMany({
      where: { userId },
    });
  }

  async findByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    return this.db.pushSubscription.findUnique({
      where: { endpoint },
    });
  }

  async countByUser(userId: string): Promise<number> {
    return this.db.pushSubscription.count({
      where: { userId },
    });
  }

  async deleteByEndpoint(userId: string, endpoint: string): Promise<boolean> {
    const result = await this.db.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return result.count > 0;
  }

  async deleteById(id: string, userId: string): Promise<boolean> {
    const result = await this.db.pushSubscription.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }

  async deleteByIdList(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.db.pushSubscription.deleteMany({
      where: { id: { in: ids } },
    });
  }
}

export const pushSubscriptionRepository = new PushSubscriptionRepository();
