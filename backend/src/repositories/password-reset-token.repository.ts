import type { PasswordResetToken } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { mongoNullOrUnset } from '../utils/mongo-null';

export class PasswordResetTokenRepository extends BaseRepository {
  async create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    return this.db.passwordResetToken.create({
      data: {
        ...data,
        usedAt: null,
      },
    });
  }

  async invalidateActiveForUser(userId: string): Promise<void> {
    await this.db.passwordResetToken.updateMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
        ...mongoNullOrUnset('usedAt'),
      },
      data: { usedAt: new Date() },
    });
  }

  async findValidByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.db.passwordResetToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        ...mongoNullOrUnset('usedAt'),
      },
    });
  }

  async markUsed(id: string): Promise<void> {
    await this.db.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}

export const passwordResetTokenRepository = new PasswordResetTokenRepository();
