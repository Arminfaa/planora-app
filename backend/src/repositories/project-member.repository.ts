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
        roleDefinition: {
          select: { id: true, name: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async create(data: {
    projectId: string;
    userId: string;
    role: import('@prisma/client').ProjectRole;
    roleDefinitionId?: string | null;
  }) {
    return this.db.projectMember.create({
      data,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        roleDefinition: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async updateRole(
    projectId: string,
    userId: string,
    role: import('@prisma/client').ProjectRole,
    roleDefinitionId?: string | null,
  ) {
    return this.db.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: {
        role,
        roleDefinitionId: roleDefinitionId ?? null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        roleDefinition: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async delete(projectId: string, userId: string): Promise<void> {
    await this.db.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
  }

  async clearRoleDefinitions(projectId: string): Promise<void> {
    await this.db.projectMember.updateMany({
      where: { projectId },
      data: { roleDefinitionId: null },
    });
  }

  async assignRoleDefinition(
    projectId: string,
    userId: string,
    roleDefinitionId: string,
  ): Promise<void> {
    await this.db.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { roleDefinitionId },
    });
  }

  async countUniqueMembersForUserProjects(userId: string): Promise<number> {
    const members = await this.db.projectMember.findMany({
      where: {
        project: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    return members.length;
  }
}

export const projectMemberRepository = new ProjectMemberRepository();
