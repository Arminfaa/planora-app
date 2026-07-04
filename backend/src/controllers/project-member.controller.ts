import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { projectMemberService } from '../services/project-member.service';
import { projectGroupActivityService } from '../services/project-group-activity.service';
import { inviteService } from '../services/invite.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getParam } from '../utils/params';
import type {
  AddProjectMemberInput,
  CreateProjectInviteInput,
  UpdateProjectMemberInput,
} from '../validators/project-member.validator';

export const listProjectMembers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const members = await projectMemberService.list(
      req.user!.userId,
      getParam(req.params, 'id'),
    );
    ApiResponse.success(res, members, 'Project members retrieved');
  },
);

export const addProjectMember = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const projectId = getParam(req.params, 'id');
    const result = await inviteService.create(
      req.user!.userId,
      projectId,
      req.body as AddProjectMemberInput,
    );

    if (result.type === 'member' && result.member) {
      void projectGroupActivityService.logMemberJoined(
        req.user!.userId,
        projectId,
        {
          memberId: result.member.id,
          memberName: result.member.name,
        },
      );
    }

    ApiResponse.success(
      res,
      result,
      result.type === 'member' ? 'Member added' : 'Invite created',
      result.type === 'invite' ? 201 : 200,
    );
  },
);

export const updateProjectMember = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const projectId = getParam(req.params, 'id');
    const member = await projectMemberService.updateRole(
      req.user!.userId,
      projectId,
      getParam(req.params, 'userId'),
      req.body as UpdateProjectMemberInput,
    );

    void projectGroupActivityService.logMemberRoleChanged(
      req.user!.userId,
      projectId,
      {
        memberId: member.id,
        memberName: member.name,
        roleName: member.roleName ?? member.role ?? 'Member',
      },
    );

    ApiResponse.success(res, member, 'Member updated');
  },
);

export const removeProjectMember = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const projectId = getParam(req.params, 'id');
    const targetUserId = getParam(req.params, 'userId');
    const members = await projectMemberService.list(
      req.user!.userId,
      projectId,
    );
    const target = members.find((m) => m.id === targetUserId);

    await projectMemberService.remove(
      req.user!.userId,
      projectId,
      targetUserId,
    );

    if (target) {
      void projectGroupActivityService.logMemberRemoved(
        req.user!.userId,
        projectId,
        { memberId: target.id, memberName: target.name },
      );
    }

    ApiResponse.success(res, null, 'Member removed');
  },
);

export const listProjectInvites = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const invites = await inviteService.listPending(
      req.user!.userId,
      getParam(req.params, 'id'),
    );
    ApiResponse.success(res, invites, 'Pending invites retrieved');
  },
);

export const createProjectInvite = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await inviteService.create(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.body as CreateProjectInviteInput,
    );
    ApiResponse.success(
      res,
      result,
      result.type === 'member' ? 'Member added' : 'Invite created',
      result.type === 'invite' ? 201 : 200,
    );
  },
);

export const revokeProjectInvite = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await inviteService.revoke(
      req.user!.userId,
      getParam(req.params, 'id'),
      getParam(req.params, 'inviteId'),
    );
    ApiResponse.success(res, null, 'Invite revoked');
  },
);

export const getInvitePreview = asyncHandler(async (req, res: Response) => {
  const preview = await inviteService.getPublicPreview(
    getParam(req.params, 'token'),
  );
  ApiResponse.success(res, preview, 'Invite preview retrieved');
});

export const acceptInvite = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await inviteService.accept(
      req.user!.userId,
      getParam(req.params, 'token'),
    );

    if (result.projectId && result.memberName && !result.alreadyMember) {
      void projectGroupActivityService.logMemberJoined(
        req.user!.userId,
        result.projectId,
        {
          memberId: req.user!.userId,
          memberName: result.memberName,
        },
      );
    }

    ApiResponse.success(res, result, 'Invite accepted');
  },
);
