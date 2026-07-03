import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { projectMemberService } from '../services/project-member.service';
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
    const result = await inviteService.create(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.body as AddProjectMemberInput,
    );
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
    const member = await projectMemberService.updateRole(
      req.user!.userId,
      getParam(req.params, 'id'),
      getParam(req.params, 'userId'),
      req.body as UpdateProjectMemberInput,
    );
    ApiResponse.success(res, member, 'Member updated');
  },
);

export const removeProjectMember = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await projectMemberService.remove(
      req.user!.userId,
      getParam(req.params, 'id'),
      getParam(req.params, 'userId'),
    );
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
    ApiResponse.success(res, result, 'Invite accepted');
  },
);
