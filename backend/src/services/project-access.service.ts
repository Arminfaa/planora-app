import type { Project } from '@prisma/client';
import { permissionService } from './permission.service';
import type { Permission } from '../permissions/registry';

export class ProjectAccessService {
  async getProjectOrThrow(projectId: string): Promise<Project> {
    return permissionService.getProjectOrThrow(projectId);
  }

  async ensureMember(userId: string, projectId: string): Promise<Project> {
    return permissionService.ensureMember(userId, projectId);
  }

  async ensurePermission(
    userId: string,
    projectId: string,
    permission: Permission,
  ): Promise<Project> {
    return permissionService.ensurePermission(userId, projectId, permission);
  }

  /** @deprecated Use ensurePermission with a specific permission instead */
  async ensureAdmin(userId: string, projectId: string): Promise<Project> {
    return permissionService.ensurePermission(userId, projectId, 'team.invite');
  }
}

export const projectAccessService = new ProjectAccessService();
