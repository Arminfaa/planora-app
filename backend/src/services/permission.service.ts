import { PermissionMode, ProjectRole, type Project } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { getDefaultRolePermissions } from '../permissions/default-roles';
import { ALL_PERMISSIONS, type Permission } from '../permissions/registry';
import { projectMemberRepository } from '../repositories/project-member.repository';
import { projectRepository } from '../repositories/project.repository';
import { roleDefinitionRepository } from '../repositories/role-definition.repository';

export class PermissionService {
  async getProjectOrThrow(projectId: string): Promise<Project> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    return project;
  }

  async getUserPermissions(
    userId: string,
    projectId: string,
  ): Promise<Permission[]> {
    const project = await this.getProjectOrThrow(projectId);

    if (project.ownerId === userId) {
      return ALL_PERMISSIONS;
    }

    const membership = await projectMemberRepository.findByProjectAndUser(
      projectId,
      userId,
    );

    if (!membership) {
      return [];
    }

    if (project.permissionMode === PermissionMode.CUSTOM) {
      if (!membership.roleDefinitionId) {
        return [];
      }

      const roleDefinition = await roleDefinitionRepository.findById(
        membership.roleDefinitionId,
      );

      if (!roleDefinition || roleDefinition.projectId !== projectId) {
        return [];
      }

      return roleDefinition.permissions.filter((p): p is Permission =>
        ALL_PERMISSIONS.includes(p as Permission),
      );
    }

    return getDefaultRolePermissions(membership.role);
  }

  async can(
    userId: string,
    projectId: string,
    permission: Permission,
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, projectId);
    return permissions.includes(permission);
  }

  async ensurePermission(
    userId: string,
    projectId: string,
    permission: Permission,
  ): Promise<Project> {
    const project = await this.getProjectOrThrow(projectId);
    const allowed = await this.can(userId, projectId, permission);

    if (!allowed) {
      throw new ApiError(
        403,
        'You do not have permission to perform this action',
      );
    }

    return project;
  }

  async ensureMember(userId: string, projectId: string): Promise<Project> {
    const project = await this.getProjectOrThrow(projectId);

    if (project.ownerId === userId) {
      return project;
    }

    const membership = await projectMemberRepository.findByProjectAndUser(
      projectId,
      userId,
    );

    if (!membership) {
      throw new ApiError(403, 'You do not have access to this project');
    }

    return project;
  }

  async getUserRoleInfo(
    userId: string,
    projectId: string,
  ): Promise<{
    role: ProjectRole | null;
    roleDefinitionId: string | null;
    roleName: string | null;
    permissions: Permission[];
  }> {
    const project = await this.getProjectOrThrow(projectId);
    const permissions = await this.getUserPermissions(userId, projectId);

    if (project.ownerId === userId) {
      return {
        role: ProjectRole.OWNER,
        roleDefinitionId: null,
        roleName: 'Owner',
        permissions,
      };
    }

    const membership = await projectMemberRepository.findByProjectAndUser(
      projectId,
      userId,
    );

    if (!membership) {
      return {
        role: null,
        roleDefinitionId: null,
        roleName: null,
        permissions: [],
      };
    }

    if (
      project.permissionMode === PermissionMode.CUSTOM &&
      membership.roleDefinitionId
    ) {
      const roleDefinition = await roleDefinitionRepository.findById(
        membership.roleDefinitionId,
      );

      return {
        role: null,
        roleDefinitionId: membership.roleDefinitionId,
        roleName: roleDefinition?.name ?? null,
        permissions,
      };
    }

    return {
      role: membership.role,
      roleDefinitionId: null,
      roleName:
        membership.role.charAt(0) + membership.role.slice(1).toLowerCase(),
      permissions,
    };
  }
}

export const permissionService = new PermissionService();
