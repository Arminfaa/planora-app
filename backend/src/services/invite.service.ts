import { randomBytes } from 'crypto';
import { ProjectRole } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { projectInviteRepository } from '../repositories/project-invite.repository';
import { projectMemberRepository } from '../repositories/project-member.repository';
import { projectRepository } from '../repositories/project.repository';
import { userRepository } from '../repositories/user.repository';
import { projectAccessService } from './project-access.service';
import { projectMemberService } from './project-member.service';
import type { CreateProjectInviteInput } from '../validators/project-member.validator';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function serializeInvite(invite: {
  id: string;
  email: string;
  role: ProjectRole;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}) {
  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    token: invite.token,
    expiresAt: invite.expiresAt.toISOString(),
    createdAt: invite.createdAt.toISOString(),
  };
}

export class InviteService {
  private createToken(): string {
    return randomBytes(32).toString('hex');
  }

  async listPending(userId: string, projectIdOrSlug: string) {
    const projectId =
      await projectMemberService.resolveProjectId(projectIdOrSlug);
    await projectAccessService.ensureAdmin(userId, projectId);

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
    const project = await projectAccessService.ensureAdmin(userId, projectId);

    const email = input.email.toLowerCase();
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
        input.role,
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
      role: input.role,
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
    await projectAccessService.ensureAdmin(userId, projectId);

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

    return {
      email: invite.email,
      role: invite.role,
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
      });
    }

    await projectInviteRepository.markAccepted(invite.id);

    return {
      projectId: project.id,
      projectSlug: project.slug,
      alreadyMember: Boolean(existing),
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
