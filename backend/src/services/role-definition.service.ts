import { PermissionMode } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { isValidPermission } from '../permissions/registry';
import { projectRepository } from '../repositories/project.repository';
import { roleDefinitionRepository } from '../repositories/role-definition.repository';
import { permissionService } from './permission.service';
import type {
  CreateRoleDefinitionInput,
  UpdateRoleDefinitionInput,
} from '../validators/role-definition.validator';

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

function serializeRoleDefinition(role: {
  id: string;
  name: string;
  permissions: string[];
  position: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: role.id,
    name: role.name,
    permissions: role.permissions,
    position: role.position,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

export class RoleDefinitionService {
  async resolveProjectId(idOrSlug: string): Promise<string> {
    if (OBJECT_ID_PATTERN.test(idOrSlug)) {
      return idOrSlug;
    }

    const project = await projectRepository.findBySlug(idOrSlug);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    return project.id;
  }

  private async ensureCustomProject(projectId: string) {
    const project = await permissionService.getProjectOrThrow(projectId);

    if (project.permissionMode !== PermissionMode.CUSTOM) {
      throw new ApiError(400, 'This project uses default roles');
    }

    return project;
  }

  async list(userId: string, projectIdOrSlug: string) {
    const projectId = await this.resolveProjectId(projectIdOrSlug);
    await permissionService.ensureMember(userId, projectId);

    const roles = await roleDefinitionRepository.findByProject(projectId);
    return roles.map(serializeRoleDefinition);
  }

  async create(
    userId: string,
    projectIdOrSlug: string,
    input: CreateRoleDefinitionInput,
  ) {
    const projectId = await this.resolveProjectId(projectIdOrSlug);
    await this.ensureCustomProject(projectId);
    await permissionService.ensurePermission(userId, projectId, 'role.manage');

    const existing = await roleDefinitionRepository.findByProjectAndName(
      projectId,
      input.name,
    );
    if (existing) {
      throw new ApiError(409, 'A role with this name already exists');
    }

    const roles = await roleDefinitionRepository.findByProject(projectId);
    const role = await roleDefinitionRepository.create({
      projectId,
      name: input.name,
      permissions: input.permissions,
      position: roles.length,
    });

    return serializeRoleDefinition(role);
  }

  async update(
    userId: string,
    projectIdOrSlug: string,
    roleId: string,
    input: UpdateRoleDefinitionInput,
  ) {
    const projectId = await this.resolveProjectId(projectIdOrSlug);
    await this.ensureCustomProject(projectId);
    await permissionService.ensurePermission(userId, projectId, 'role.manage');

    const existing = await roleDefinitionRepository.findById(roleId);
    if (!existing || existing.projectId !== projectId) {
      throw new ApiError(404, 'Role not found');
    }

    if (input.name && input.name !== existing.name) {
      const duplicate = await roleDefinitionRepository.findByProjectAndName(
        projectId,
        input.name,
      );
      if (duplicate) {
        throw new ApiError(409, 'A role with this name already exists');
      }
    }

    if (input.permissions) {
      const invalid = input.permissions.filter((p) => !isValidPermission(p));
      if (invalid.length > 0) {
        throw new ApiError(400, 'One or more permissions are invalid');
      }
    }

    const updated = await roleDefinitionRepository.update(roleId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.permissions !== undefined
        ? { permissions: input.permissions }
        : {}),
    });

    return serializeRoleDefinition(updated);
  }

  async delete(userId: string, projectIdOrSlug: string, roleId: string) {
    const projectId = await this.resolveProjectId(projectIdOrSlug);
    await this.ensureCustomProject(projectId);
    await permissionService.ensurePermission(userId, projectId, 'role.manage');

    const existing = await roleDefinitionRepository.findById(roleId);
    if (!existing || existing.projectId !== projectId) {
      throw new ApiError(404, 'Role not found');
    }

    const [memberCount, inviteCount] = await Promise.all([
      roleDefinitionRepository.countMembersWithRole(roleId),
      roleDefinitionRepository.countInvitesWithRole(roleId),
    ]);

    if (memberCount > 0 || inviteCount > 0) {
      throw new ApiError(
        400,
        'Cannot delete a role that is assigned to members or pending invites',
      );
    }

    await roleDefinitionRepository.delete(roleId);
  }
}

export const roleDefinitionService = new RoleDefinitionService();
