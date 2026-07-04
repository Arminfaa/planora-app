import type { RefreshToken } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class RefreshTokenRepository extends BaseRepository {
  async create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return this.db.refreshToken.create({ data });
  }

  async findValidByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.db.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async revoke(id: string): Promise<void> {
    await this.db.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeByHash(tokenHash: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
