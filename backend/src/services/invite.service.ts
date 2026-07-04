import { randomBytes } from 'crypto';
import { PermissionMode, ProjectRole } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { projectInviteRepository } from '../repositories/project-invite.repository';
import { projectMemberRepository } from '../repositories/project-member.repository';
import { projectRepository } from '../repositories/project.repository';
import { roleDefinitionRepository } from '../repositories/role-definition.repository';
import { userRepository } from '../repositories/user.repository';
import { projectAccessService } from './project-access.service';
import { projectMemberService } from './project-member.service';
import type { CreateProjectInviteInput } from '../validators/project-member.validator';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function serializeInvite(invite: {
  id: string;
  email: string;
  role: ProjectRole;
  roleDefinitionId: string | null;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  roleDefinition?: { id: string; name: string } | null;
}) {
  return {
    id: invite.id,
    email: invite.email,
    role: invite.roleDefinitionId ? undefined : invite.role,
    roleDefinitionId: invite.roleDefinitionId ?? undefined,
    roleName: invite.roleDefinition?.name,
    token: invite.token,
    expiresAt: invite.expiresAt.toISOString(),
    createdAt: invite.createdAt.toISOString(),
  };
}

export class InviteService {
  private createToken(): string {
    return randomBytes(32).toString('hex');
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

  async listPending(userId: string, projectIdOrSlug: string) {
    const projectId =
      await projectMemberService.resolveProjectId(projectIdOrSlug);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'team.manage_invites',
    );

    const invites =
      await projectInviteRepository.findPendingByProject(projectId);
    return invites.map(serializeInvite);
  }

  async create(
    userId: string,
    projectIdOrSlug: string,
    input: CreateProjectInviteInput,
  ) {
    const projectId =
      await projectMemberService.resolveProjectId(projectIdOrSlug);
    const project = await projectAccessService.ensurePermission(
      userId,
      projectId,
      'team.invite',
    );

    const email = input.email.toLowerCase();
    const assignment = await this.resolveRoleAssignment(projectId, input);
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      if (project.ownerId === existingUser.id) {
        throw new ApiError(400, 'Project owner is already a member');
      }

      const membership = await projectMemberRepository.findByProjectAndUser(
        projectId,
        existingUser.id,
      );
      if (membership) {
        throw new ApiError(409, 'User is already a member of this project');
      }

      return projectMemberService.addExistingUser(
        userId,
        projectId,
        existingUser.id,
        assignment.role,
        assignment.roleDefinitionId,
        project,
      );
    }

    const pending = await projectInviteRepository.findPendingByProjectAndEmail(
      projectId,
      email,
    );
    if (pending) {
      throw new ApiError(409, 'A pending invite already exists for this email');
    }

    const invite = await projectInviteRepository.create({
      projectId,
      email,
      role: assignment.role,
      roleDefinitionId: assignment.roleDefinitionId,
      token: this.createToken(),
      invitedBy: userId,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    });

    return {
      type: 'invite' as const,
      invite: serializeInvite(invite),
      project: { id: project.id, name: project.name, slug: project.slug },
    };
  }

  async revoke(userId: string, projectIdOrSlug: string, inviteId: string) {
    const projectId =
      await projectMemberService.resolveProjectId(projectIdOrSlug);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'team.manage_invites',
    );

    const invites =
      await projectInviteRepository.findPendingByProject(projectId);
    const invite = invites.find((item) => item.id === inviteId);
    if (!invite) {
      throw new ApiError(404, 'Invite not found');
    }

    await projectInviteRepository.delete(inviteId);
  }

  async getPublicPreview(token: string) {
    const invite = await projectInviteRepository.findByToken(token);
    if (!invite) {
      throw new ApiError(404, 'Invite not found');
    }

    const expired = invite.expiresAt < new Date();
    const accepted = invite.acceptedAt !== null;

    const roleDefinition = invite.roleDefinitionId
      ? await roleDefinitionRepository.findById(invite.roleDefinitionId)
      : null;

    return {
      email: invite.email,
      role: invite.roleDefinitionId ? undefined : invite.role,
      roleDefinitionId: invite.roleDefinitionId ?? undefined,
      roleName: roleDefinition?.name,
      projectName: invite.project.name,
      projectSlug: invite.project.slug,
      expired,
      accepted,
      valid: !expired && !accepted,
    };
  }

  async accept(userId: string, token: string) {
    const invite = await this.getValidInvite(token);
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ApiError(
        403,
        'This invite was sent to a different email address',
      );
    }

    const project = await projectRepository.findById(invite.projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    if (project.ownerId === userId) {
      await projectInviteRepository.markAccepted(invite.id);
      return {
        projectId: project.id,
        projectSlug: project.slug,
        alreadyMember: true,
        memberName: user.name,
      };
    }

    const existing = await projectMemberRepository.findByProjectAndUser(
      invite.projectId,
      userId,
    );
    if (!existing) {
      await projectMemberRepository.create({
        projectId: invite.projectId,
        userId,
        role: invite.role,
        roleDefinitionId: invite.roleDefinitionId,
      });
    }

    await projectInviteRepository.markAccepted(invite.id);

    return {
      projectId: project.id,
      projectSlug: project.slug,
      alreadyMember: Boolean(existing),
      memberName: user.name,
    };
  }

  async acceptDuringRegistration(userId: string, token: string) {
    return this.accept(userId, token);
  }

  private async getValidInvite(token: string) {
    const invite = await projectInviteRepository.findByToken(token);
    if (!invite) {
      throw new ApiError(404, 'Invite not found');
    }
    if (invite.acceptedAt) {
      throw new ApiError(410, 'Invite has already been used');
    }
    if (invite.expiresAt < new Date()) {
      throw new ApiError(410, 'Invite has expired');
    }
    return invite;
  }
}

export const inviteService = new InviteService();
