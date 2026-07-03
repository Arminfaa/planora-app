import { ProjectRole } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { buildPagination } from '../utils/pagination';
import { toSlug } from '../utils/slug';
import { projectRepository } from '../repositories/project.repository';
import { projectMemberRepository } from '../repositories/project-member.repository';
import { projectAccessService } from './project-access.service';
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

  async list(userId: string, page: number, limit: number) {
    const { items, total } = await projectRepository.findByUser(
      userId,
      page,
      limit,
    );
    return buildPagination(items, total, page, limit);
  }

  async getById(userId: string, idOrSlug: string) {
    const projectId = await this.resolveProjectId(idOrSlug);
    await projectAccessService.ensureMember(userId, projectId);

    const project = await projectRepository.findByIdWithDetails(projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    let currentUserRole: ProjectRole;
    if (project.ownerId === userId) {
      currentUserRole = ProjectRole.OWNER;
    } else {
      const membership = await projectMemberRepository.findByProjectAndUser(
        projectId,
        userId,
      );
      currentUserRole = membership!.role;
    }

    return { ...project, currentUserRole };
  }

  async listMembers(userId: string, idOrSlug: string) {
    const projectId = await this.resolveProjectId(idOrSlug);
    await projectAccessService.ensureMember(userId, projectId);

    const members =
      await projectMemberRepository.findMembersByProject(projectId);

    return members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      avatar: member.user.avatar,
      role: member.role,
    }));
  }

  async create(userId: string, input: CreateProjectInput) {
    let slug = toSlug(input.name);
    const existing = await projectRepository.findBySlug(slug);

    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const project = await projectRepository.create({
      name: input.name,
      slug,
      description: input.description,
      ownerId: userId,
    });

    await projectRepository.addOwnerAsMember(project.id, userId);

    return project;
  }

  async update(userId: string, idOrSlug: string, input: UpdateProjectInput) {
    const projectId = await this.resolveProjectId(idOrSlug);
    await projectAccessService.ensureAdmin(userId, projectId);
    return projectRepository.update(projectId, input);
  }

  async delete(userId: string, idOrSlug: string) {
    const projectId = await this.resolveProjectId(idOrSlug);
    await projectAccessService.ensureAdmin(userId, projectId);
    await projectRepository.delete(projectId);
  }
}

export const projectService = new ProjectService();
