import { Router } from 'express';
import {
  createTaskComment,
  deleteTaskComment,
  listTaskComments,
  updateTaskComment,
} from '../../controllers/comment.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  validateBody,
  validateParams,
} from '../../middlewares/validate.middleware';
import {
  commentParamsSchema,
  createCommentSchema,
  updateCommentSchema,
} from '../../validators/comment.validator';
import { taskIdParamSchema } from '../../validators/task.validator';

export const taskCommentRoutes = Router({ mergeParams: true });

taskCommentRoutes.use(authenticate);

taskCommentRoutes.get('/', validateParams(taskIdParamSchema), listTaskComments);

taskCommentRoutes.post(
  '/',
  validateParams(taskIdParamSchema),
  validateBody(createCommentSchema),
  createTaskComment,
);

taskCommentRoutes.patch(
  '/:commentId',
  validateParams(commentParamsSchema),
  validateBody(updateCommentSchema),
  updateTaskComment,
);

taskCommentRoutes.delete(
  '/:commentId',
  validateParams(commentParamsSchema),
  deleteTaskComment,
);
