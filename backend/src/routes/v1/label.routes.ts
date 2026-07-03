import { Router } from 'express';
import {
  assignTaskLabel,
  createProjectLabel,
  deleteProjectLabel,
  listProjectLabels,
  removeTaskLabel,
  updateProjectLabel,
} from '../../controllers/label.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  validateBody,
  validateParams,
} from '../../middlewares/validate.middleware';
import { projectParamsSchema } from '../../validators/project.validator';
import {
  assignTaskLabelSchema,
  createLabelSchema,
  labelParamsSchema,
  taskLabelParamsSchema,
  updateLabelSchema,
} from '../../validators/label.validator';
import { taskIdParamSchema } from '../../validators/task.validator';

export const projectLabelRoutes = Router({ mergeParams: true });

projectLabelRoutes.use(authenticate);

projectLabelRoutes.get(
  '/',
  validateParams(projectParamsSchema),
  listProjectLabels,
);

projectLabelRoutes.post(
  '/',
  validateParams(projectParamsSchema),
  validateBody(createLabelSchema),
  createProjectLabel,
);

projectLabelRoutes.patch(
  '/:labelId',
  validateParams(labelParamsSchema),
  validateBody(updateLabelSchema),
  updateProjectLabel,
);

projectLabelRoutes.delete(
  '/:labelId',
  validateParams(labelParamsSchema),
  deleteProjectLabel,
);

export const taskLabelRoutes = Router({ mergeParams: true });

taskLabelRoutes.use(authenticate);

taskLabelRoutes.post(
  '/',
  validateParams(taskIdParamSchema),
  validateBody(assignTaskLabelSchema),
  assignTaskLabel,
);

taskLabelRoutes.delete(
  '/:labelId',
  validateParams(taskLabelParamsSchema),
  removeTaskLabel,
);
