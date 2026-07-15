import type { RefreshToken } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { mongoNullOrUnset } from '../utils/mongo-null';

export class RefreshTokenRepository extends BaseRepository {
  async create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return this.db.refreshToken.create({
      data: {
        ...data,
        revokedAt: null,
      },
    });
  }

  async findValidByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.db.refreshToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        ...mongoNullOrUnset('revokedAt'),
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
      where: {
        tokenHash,
        ...mongoNullOrUnset('revokedAt'),
      },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: {
        userId,
        ...mongoNullOrUnset('revokedAt'),
      },
      data: { revokedAt: new Date() },
    });
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
