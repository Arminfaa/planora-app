import type { User } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository {
  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    return this.db.user.create({ data });
  }

  async update(
    id: string,
    data: Partial<Pick<User, 'name' | 'avatar' | 'password'>>,
  ): Promise<User> {
    return this.db.user.update({ where: { id }, data });
  }
}

export const userRepository = new UserRepository();
