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
}

export const projectMemberRepository = new ProjectMemberRepository();
