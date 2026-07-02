import { ProjectRole, type Project } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { projectMemberRepository } from '../repositories/project-member.repository';
import { projectRepository } from '../repositories/project.repository';

const ADMIN_ROLES: ProjectRole[] = [ProjectRole.OWNER, ProjectRole.ADMIN];

export class ProjectAccessService {
  async getProjectOrThrow(projectId: string): Promise<Project> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
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

  async ensureAdmin(userId: string, projectId: string): Promise<Project> {
    const project = await this.getProjectOrThrow(projectId);

    if (project.ownerId === userId) {
      return project;
    }

    const membership = await projectMemberRepository.findByProjectAndUser(
      projectId,
      userId,
    );

    if (!membership || !ADMIN_ROLES.includes(membership.role)) {
      throw new ApiError(403, 'Admin access required');
    }

    return project;
  }
}

export const projectAccessService = new ProjectAccessService();
