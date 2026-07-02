import { ProjectRole, type Project, type Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class ProjectRepository extends BaseRepository {
  async findById(id: string): Promise<Project | null> {
    return this.db.project.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Project | null> {
    return this.db.project.findUnique({ where: { slug } });
  }

  async findByUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Project[]; total: number }> {
    const where: Prisma.ProjectWhereInput = {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    };

    const [items, total] = await Promise.all([
      this.db.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { boards: true, members: true } },
        },
      }),
      this.db.project.count({ where }),
    ]);

    return { items, total };
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    ownerId: string;
  }): Promise<Project> {
    return this.db.project.create({ data });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return this.db.project.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.project.delete({ where: { id } });
  }

  async addOwnerAsMember(projectId: string, userId: string): Promise<void> {
    await this.db.projectMember.create({
      data: {
        projectId,
        userId,
        role: ProjectRole.OWNER,
      },
    });
  }
}

export const projectRepository = new ProjectRepository();
