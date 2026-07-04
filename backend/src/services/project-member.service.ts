import { PermissionMode, ProjectRole } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { projectMemberRepository } from '../repositories/project-member.repository';
import { projectRepository } from '../repositories/project.repository';
import { roleDefinitionRepository } from '../repositories/role-definition.repository';
import { taskRepository } from '../repositories/task.repository';
import { userRepository } from '../repositories/user.repository';
import { projectAccessService } from './project-access.service';
import type {
  AddProjectMemberInput,
  UpdateProjectMemberInput,
} from '../validators/project-member.validator';

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

function serializeMember(member: {
  id: string;
  role: ProjectRole;
  roleDefinitionId: string | null;
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  roleDefinition?: { id: string; name: string } | null;
}) {
  return {
    id: member.user.id,
    membershipId: member.id,
    name: member.user.name,
    email: member.user.email,
    avatar: member.user.avatar,
    role: member.roleDefinition ? undefined : member.role,
    roleDefinitionId: member.roleDefinitionId ?? undefined,
    roleName:
      member.roleDefinition?.name ??
      (member.role === ProjectRole.OWNER
        ? 'Owner'
        : member.role.charAt(0) + member.role.slice(1).toLowerCase()),
    joinedAt: member.joinedAt.toISOString(),
  };
}

export class ProjectMemberService {
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

  private async resolveRoleAssignment(
    projectId: string,
    input: { role?: ProjectRole; roleDefinitionId?: string },
  ) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    if (project.permissionMode === PermissionMode.CUSTOM) {
      if (!input.roleDefinitionId) {
        throw new ApiError(
          400,
          'roleDefinitionId is required for custom projects',
        );
      }

      const roleDefinition = await roleDefinitionRepository.findById(
        input.roleDefinitionId,
      );
      if (!roleDefinition || roleDefinition.projectId !== projectId) {
        throw new ApiError(404, 'Role not found');
      }

      return {
        role: ProjectRole.MEMBER,
        roleDefinitionId: input.roleDefinitionId,
      };
    }

    if (!input.role) {
      throw new ApiError(400, 'role is required for default role projects');
    }

    return {
      role: input.role,
      roleDefinitionId: null as string | null,
    };
  }

  async list(userId: string, projectIdOrSlug: string) {
    const projectId = await this.resolveProjectId(projectIdOrSlug);
    await projectAccessService.ensurePermission(userId, projectId, 'team.view');

    const members =
      await projectMemberRepository.findMembersByProject(projectId);
    return members.map(serializeMember);
  }

  async addByEmail(
    actorId: string,
    projectIdOrSlug: string,
    input: AddProjectMemberInput,
  ) {
    const projectId = await this.resolveProjectId(projectIdOrSlug);
    await projectAccessService.ensurePermission(
      actorId,
      projectId,
      'team.invite',
    );

    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new ApiError(404, 'User not found. Send an invite instead.');
    }

    const assignment = await this.resolveRoleAssignment(projectId, input);

    return this.addExistingUser(
      actorId,
      projectId,
      user.id,
      assignment.role,
      assignment.roleDefinitionId,
    );
  }

  async addExistingUser(
    actorId: string,
    projectId: string,
    userId: string,
    role: ProjectRole,
    roleDefinitionId?: string | null,
    project?: { ownerId: string; id: string; name: string; slug: string },
  ) {
    const resolvedProject =
      project ??
      (await projectAccessService.ensurePermission(
        actorId,
        projectId,
        'team.invite',
      ));

    if (resolvedProject.ownerId === userId) {
      throw new ApiError(400, 'Project owner is already a member');
    }

    const existing = await projectMemberRepository.findByProjectAndUser(
      projectId,
      userId,
    );
    if (existing) {
      throw new ApiError(409, 'User is already a member of this project');
    }

    const member = await projectMemberRepository.create({
      projectId,
      userId,
      role,
      roleDefinitionId: roleDefinitionId ?? null,
    });

    return {
      type: 'member' as const,
      member: serializeMember(member),
    };
  }

  async updateRole(
    actorId: string,
    projectIdOrSlug: string,
    targetUserId: string,
    input: UpdateProjectMemberInput,
  ) {
    const projectId = await this.resolveProjectId(projectIdOrSlug);
    const project = await projectAccessService.ensurePermission(
      actorId,
      projectId,
      'team.change_role',
    );

    if (project.ownerId === targetUserId) {
      throw new ApiError(400, 'Cannot change the project owner role');
    }

    const membership = await projectMemberRepository.findByProjectAndUser(
      projectId,
      targetUserId,
    );
    if (!membership) {
      throw new ApiError(404, 'Member not found');
    }

    if (membership.role === ProjectRole.OWNER) {
      throw new ApiError(400, 'Cannot change the project owner role');
    }

    const assignment = await this.resolveRoleAssignment(projectId, input);

    const member = await projectMemberRepository.updateRole(
      projectId,
      targetUserId,
      assignment.role,
      assignment.roleDefinitionId,
    );

    return serializeMember(member);
  }

  async remove(actorId: string, projectIdOrSlug: string, targetUserId: string) {
    const projectId = await this.resolveProjectId(projectIdOrSlug);
    const project = await projectAccessService.ensurePermission(
      actorId,
      projectId,
      'team.remove',
    );

    if (project.ownerId === targetUserId) {
      throw new ApiError(400, 'Cannot remove the project owner');
    }

    if (actorId === targetUserId) {
      throw new ApiError(400, 'You cannot remove yourself from the project');
    }

    const membership = await projectMemberRepository.findByProjectAndUser(
      projectId,
      targetUserId,
    );
    if (!membership) {
      throw new ApiError(404, 'Member not found');
    }

    if (membership.role === ProjectRole.OWNER) {
      throw new ApiError(400, 'Cannot remove the project owner');
    }

    await taskRepository.unassignUserFromProject(targetUserId, projectId);
    await projectMemberRepository.delete(projectId, targetUserId);
  }
}

export const projectMemberService = new ProjectMemberService();
