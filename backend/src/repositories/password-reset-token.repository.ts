import type { PasswordResetToken } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class PasswordResetTokenRepository extends BaseRepository {
  async create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    return this.db.passwordResetToken.create({ data });
  }

  async invalidateActiveForUser(userId: string): Promise<void> {
    await this.db.passwordResetToken.updateMany({
      where: {
        userId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });
  }

  async findValidByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.db.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
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
