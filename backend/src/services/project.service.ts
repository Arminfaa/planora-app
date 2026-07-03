import { ProjectRole, type Prisma } from '@prisma/client';
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

  async create(userId: string, input: CreateProjectInput) {
    const slug = await this.generateUniqueSlug(input.name);

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
    await projectAccessService.ensureAdmin(userId, projectId);
    await projectRepository.delete(projectId);
  }
}

export const projectService = new ProjectService();
