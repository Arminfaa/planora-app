import type { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';

export abstract class BaseRepository {
  protected readonly db: PrismaClient = prisma;
}
