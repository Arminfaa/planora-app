import { PermissionMode, ProjectRole, type Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { buildPagination } from '../utils/pagination';
import { toSlug } from '../utils/slug';
import { PERMISSION_GROUPS } from '../permissions/registry';
import { projectRepository } from '../repositories/project.repository';
import { projectMemberRepository } from '../repositories/project-member.repository';
import { projectInviteRepository } from '../repositories/project-invite.repository';
import { roleDefinitionRepository } from '../repositories/role-definition.repository';
import { permissionService } from './permission.service';
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from '../validators/project.validator';

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export class ProjectService {
  private async resolveProjectId(idOrSlug: string): Promise<string> {
    if (OBJECT_ID_PATTERN.test(idOrSlug)) {
      return idOrSlug;
    }

    const project = await projectRepository.findBySlug(idOrSlug);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    return project.id;
  }

  private async generateUniqueSlug(
    name: string,
    excludeProjectId?: string,
  ): Promise<string> {
    let slug = toSlug(name) || `project-${Date.now()}`;
    const existing = await projectRepository.findBySlug(slug);

    if (existing && existing.id !== excludeProjectId) {
      slug = `${slug}-${Date.now()}`;
    }

    return slug;
  }

  async list(userId: string, page: number, limit: number) {
    const [{ items, total }, uniqueMemberCount] = await Promise.all([
      projectRepository.findByUser(userId, page, limit),
      projectMemberRepository.countUniqueMembersForUserProjects(userId),
    ]);

    return {
      ...buildPagination(items, total, page, limit),
      stats: { uniqueMemberCount },
    };
  }

  async getById(userId: string, idOrSlug: string) {
    const projectId = await this.resolveProjectId(idOrSlug);
    await permissionService.ensureMember(userId, projectId);

    const project = await projectRepository.findByIdWithDetails(projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const roleInfo = await permissionService.getUserRoleInfo(userId, projectId);

    return {
      ...project,
      currentUserRole: roleInfo.role ?? undefined,
      currentUserRoleName: roleInfo.roleName,
      currentUserRoleDefinitionId: roleInfo.roleDefinitionId,
      currentUserPermissions: roleInfo.permissions,
    };
  }

  async getPermissionCatalog() {
    return PERMISSION_GROUPS;
  }

  async create(userId: string, input: CreateProjectInput) {
    const slug = await this.generateUniqueSlug(input.name);

    const project = await projectRepository.create({
      name: input.name,
      slug,
      description: input.description,
      ownerId: userId,
      permissionMode: input.permissionMode ?? PermissionMode.DEFAULT,
    });

    await projectRepository.addOwnerAsMember(project.id, userId);

    if (
      input.permissionMode === PermissionMode.CUSTOM &&
      input.customRoles?.length
    ) {
      await roleDefinitionRepository.createMany(project.id, input.customRoles);
    }

    return project;
  }

  private findRoleForMember(
    roles: { id: string; name: string; permissions: string[] }[],
    memberRole: ProjectRole,
  ): string | null {
    if (roles.length === 0) return null;

    const normalized = memberRole.toLowerCase();
    const byName = roles.find((role) =>
      role.name.toLowerCase().includes(normalized),
    );
    if (byName) return byName.id;

    if (memberRole === ProjectRole.ADMIN) {
      return [...roles].sort(
        (a, b) => b.permissions.length - a.permissions.length,
      )[0].id;
    }

    return [...roles].sort(
      (a, b) => a.permissions.length - b.permissions.length,
    )[0].id;
  }

  private async switchToCustomRoles(
    projectId: string,
    customRoles: { name: string; permissions: string[] }[],
  ): Promise<void> {
    const createdRoles = await roleDefinitionRepository.createMany(
      projectId,
      customRoles,
    );

    const members =
      await projectMemberRepository.findMembersByProject(projectId);

    for (const member of members) {
      if (member.role === ProjectRole.OWNER) continue;

      const roleDefinitionId = this.findRoleForMember(
        createdRoles,
        member.role,
      );
      if (!roleDefinitionId) continue;

      await projectMemberRepository.assignRoleDefinition(
        projectId,
        member.user.id,
        roleDefinitionId,
      );
    }
  }

  private async switchToDefaultRoles(projectId: string): Promise<void> {
    await projectMemberRepository.clearRoleDefinitions(projectId);
    await projectInviteRepository.clearRoleDefinitions(projectId);
    await roleDefinitionRepository.deleteByProject(projectId);
  }

  async update(userId: string, idOrSlug: string, input: UpdateProjectInput) {
    const projectId = await this.resolveProjectId(idOrSlug);
    const existing = await permissionService.ensurePermission(
      userId,
      projectId,
      'project.edit',
    );

    const updateData: Prisma.ProjectUpdateInput = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
      updateData.slug = await this.generateUniqueSlug(input.name, projectId);
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    const isModeChange =
      input.permissionMode !== undefined &&
      input.permissionMode !== existing.permissionMode;

    if (isModeChange) {
      if (input.permissionMode === PermissionMode.CUSTOM) {
        if (!input.customRoles?.length) {
          throw new ApiError(
            400,
            'At least one custom role is required when switching to custom access',
          );
        }

        updateData.permissionMode = PermissionMode.CUSTOM;
        const project = await projectRepository.update(projectId, updateData);
        await this.switchToCustomRoles(projectId, input.customRoles);
        return project;
      }

      await this.switchToDefaultRoles(projectId);
      updateData.permissionMode = PermissionMode.DEFAULT;
    }

    return projectRepository.update(projectId, updateData);
  }

  async delete(userId: string, idOrSlug: string) {
    const projectId = await this.resolveProjectId(idOrSlug);
    await permissionService.ensurePermission(
      userId,
      projectId,
      'project.delete',
    );
    await projectRepository.delete(projectId);
  }
}

export const projectService = new ProjectService();
