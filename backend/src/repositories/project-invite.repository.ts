import type { ProjectInvite, ProjectRole } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class ProjectInviteRepository extends BaseRepository {
  async findByToken(token: string) {
    return this.db.projectInvite.findUnique({
      where: { token },
      include: {
        project: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async findPendingByProjectAndEmail(projectId: string, email: string) {
    return this.db.projectInvite.findFirst({
      where: {
        projectId,
        email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async findPendingByProject(projectId: string) {
    return this.db.projectInvite.findMany({
      where: {
        projectId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    projectId: string;
    email: string;
    role: ProjectRole;
    roleDefinitionId?: string | null;
    token: string;
    invitedBy: string;
    expiresAt: Date;
  }): Promise<ProjectInvite> {
    return this.db.projectInvite.create({ data });
  }

  async markAccepted(id: string): Promise<ProjectInvite> {
    return this.db.projectInvite.update({
      where: { id },
      data: { acceptedAt: new Date() },
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.projectInvite.delete({ where: { id } });
  }
}

export const projectInviteRepository = new ProjectInviteRepository();
