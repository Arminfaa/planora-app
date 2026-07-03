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
}

export const projectMemberRepository = new ProjectMemberRepository();
