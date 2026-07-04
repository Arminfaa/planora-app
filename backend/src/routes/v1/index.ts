import { Router } from 'express';
import { checkDatabaseHealth } from '../../config';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import authRoutes from './auth.routes';
import { boardRouter, projectBoardRoutes } from './board.routes';
import { boardColumnRouter, columnRouter } from './column.routes';
import projectRoutes from './project.routes';
import roleDefinitionRoutes from './role-definition.routes';
import inviteRoutes, {
  projectInviteRoutes,
  projectMemberRoutes,
} from './invite.routes';
import searchRoutes from './search.routes';
import { columnTaskRouter, taskRouter } from './task.routes';
import { checklistRouter } from './checklist.routes';
import { projectLabelRoutes, taskLabelRoutes } from './label.routes';
import { taskCommentRoutes } from './comment.routes';
import { taskAttachmentRoutes } from './attachment.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/invites', inviteRoutes);
router.use('/projects', projectRoutes);
router.use('/projects/:id/roles', roleDefinitionRoutes);
router.use('/projects/:id/members', projectMemberRoutes);
router.use('/projects/:id/invites', projectInviteRoutes);
router.use('/projects/:id/labels', projectLabelRoutes);
router.use('/search', searchRoutes);
router.use('/projects/:projectId/boards', projectBoardRoutes);
router.use('/boards', boardRouter);
router.use('/boards/:boardId/columns', boardColumnRouter);
router.use('/columns', columnRouter);
router.use('/columns/:columnId/tasks', columnTaskRouter);
router.use('/tasks', taskRouter);
router.use('/tasks/:id/checklist', checklistRouter);
router.use('/tasks/:id/labels', taskLabelRoutes);
router.use('/tasks/:id/comments', taskCommentRoutes);
router.use('/tasks/:id/attachments', taskAttachmentRoutes);

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const dbHealthy = await checkDatabaseHealth();

    ApiResponse.success(res, {
      status: dbHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: 'v1',
      database: dbHealthy ? 'connected' : 'disconnected',
    });
  }),
);

export default router;
