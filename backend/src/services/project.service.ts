import { PermissionMode, type Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { buildPagination } from '../utils/pagination';
import { toSlug } from '../utils/slug';
import { PERMISSION_GROUPS } from '../permissions/registry';
import { projectRepository } from '../repositories/project.repository';
import { projectMemberRepository } from '../repositories/project-member.repository';
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

  async update(userId: string, idOrSlug: string, input: UpdateProjectInput) {
    const projectId = await this.resolveProjectId(idOrSlug);
    await permissionService.ensurePermission(userId, projectId, 'project.edit');

    const updateData: Prisma.ProjectUpdateInput = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
      updateData.slug = await this.generateUniqueSlug(input.name, projectId);
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
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
