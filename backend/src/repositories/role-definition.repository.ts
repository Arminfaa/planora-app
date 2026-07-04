import type { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class RoleDefinitionRepository extends BaseRepository {
  async findById(id: string) {
    return this.db.projectRoleDefinition.findUnique({ where: { id } });
  }

  async findByProject(projectId: string) {
    return this.db.projectRoleDefinition.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    });
  }

  async findByProjectAndName(projectId: string, name: string) {
    return this.db.projectRoleDefinition.findUnique({
      where: { projectId_name: { projectId, name } },
    });
  }

  async create(data: {
    projectId: string;
    name: string;
    permissions: string[];
    position?: number;
  }) {
    return this.db.projectRoleDefinition.create({ data });
  }

  async createMany(
    projectId: string,
    roles: { name: string; permissions: string[]; position?: number }[],
  ) {
    return this.db.$transaction(
      roles.map((role, index) =>
        this.db.projectRoleDefinition.create({
          data: {
            projectId,
            name: role.name,
            permissions: role.permissions,
            position: role.position ?? index,
          },
        }),
      ),
    );
  }

  async update(id: string, data: Prisma.ProjectRoleDefinitionUpdateInput) {
    return this.db.projectRoleDefinition.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.projectRoleDefinition.delete({ where: { id } });
  }

  async countMembersWithRole(roleDefinitionId: string): Promise<number> {
    return this.db.projectMember.count({
      where: { roleDefinitionId },
    });
  }

  async countInvitesWithRole(roleDefinitionId: string): Promise<number> {
    return this.db.projectInvite.count({
      where: { roleDefinitionId, acceptedAt: null },
    });
  }
}

export const roleDefinitionRepository = new RoleDefinitionRepository();
