import { Router } from 'express';
import {
  acceptInvite,
  addProjectMember,
  createProjectInvite,
  getInvitePreview,
  listProjectInvites,
  listProjectMembers,
  removeProjectMember,
  revokeProjectInvite,
  updateProjectMember,
} from '../../controllers/project-member.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  validateBody,
  validateParams,
} from '../../middlewares/validate.middleware';
import { projectParamsSchema } from '../../validators/project.validator';
import {
  addProjectMemberSchema,
  createProjectInviteSchema,
  inviteTokenParamSchema,
  projectMemberParamsSchema,
  updateProjectMemberSchema,
} from '../../validators/project-member.validator';
import { objectIdSchema } from '../../utils/pagination';

const inviteIdParamsSchema = projectParamsSchema.extend({
  inviteId: objectIdSchema,
});

const router = Router();

router.get('/:token', validateParams(inviteTokenParamSchema), getInvitePreview);

router.post(
  '/:token/accept',
  authenticate,
  validateParams(inviteTokenParamSchema),
  acceptInvite,
);

export default router;

export const projectMemberRoutes = Router({ mergeParams: true });

projectMemberRoutes.use(authenticate);

projectMemberRoutes.get(
  '/',
  validateParams(projectParamsSchema),
  listProjectMembers,
);

projectMemberRoutes.post(
  '/',
  validateParams(projectParamsSchema),
  validateBody(addProjectMemberSchema),
  addProjectMember,
);

projectMemberRoutes.patch(
  '/:userId',
  validateParams(projectMemberParamsSchema),
  validateBody(updateProjectMemberSchema),
  updateProjectMember,
);

projectMemberRoutes.delete(
  '/:userId',
  validateParams(projectMemberParamsSchema),
  removeProjectMember,
);

export const projectInviteRoutes = Router({ mergeParams: true });

projectInviteRoutes.use(authenticate);

projectInviteRoutes.get(
  '/',
  validateParams(projectParamsSchema),
  listProjectInvites,
);

projectInviteRoutes.post(
  '/',
  validateParams(projectParamsSchema),
  validateBody(createProjectInviteSchema),
  createProjectInvite,
);

projectInviteRoutes.delete(
  '/:inviteId',
  validateParams(inviteIdParamsSchema),
  revokeProjectInvite,
);
