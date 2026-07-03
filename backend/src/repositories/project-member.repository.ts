import type { ProjectMember } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class ProjectMemberRepository extends BaseRepository {
  async findByProjectAndUser(
    projectId: string,
    userId: string,
  ): Promise<ProjectMember | null> {
    return this.db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
  }

  async findMembersByProject(projectId: string) {
    return this.db.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async create(data: {
    projectId: string;
    userId: string;
    role: import('@prisma/client').ProjectRole;
  }) {
    return this.db.projectMember.create({
      data,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });
  }

  async updateRole(
    projectId: string,
    userId: string,
    role: import('@prisma/client').ProjectRole,
  ) {
    return this.db.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });
  }

  async delete(projectId: string, userId: string): Promise<void> {
    await this.db.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
  }
}

export const projectMemberRepository = new ProjectMemberRepository();
