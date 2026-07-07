import type { NotificationPreference } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class NotificationPreferenceRepository extends BaseRepository {
  async findByUser(userId: string): Promise<NotificationPreference | null> {
    return this.db.notificationPreference.findUnique({
      where: { userId },
    });
  }

  async findByUserIds(userIds: string[]): Promise<NotificationPreference[]> {
    if (userIds.length === 0) return [];

    return this.db.notificationPreference.findMany({
      where: { userId: { in: userIds } },
    });
  }

  async getOrCreate(userId: string): Promise<NotificationPreference> {
    const existing = await this.findByUser(userId);
    if (existing) return existing;

    return this.db.notificationPreference.create({
      data: { userId },
    });
  }

  async update(
    userId: string,
    data: Partial<
      Pick<
        NotificationPreference,
        'taskChanges' | 'groupMessages' | 'pushEnabled' | 'preferredLocale'
      >
    >,
  ): Promise<NotificationPreference> {
    return this.db.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
}

export const notificationPreferenceRepository =
  new NotificationPreferenceRepository();
