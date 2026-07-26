import { Router } from 'express';
import {
  createLinkTaskAttachment,
  deleteTaskAttachment,
  listTaskAttachments,
  uploadTaskAttachment,
} from '../../controllers/attachment.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  validateBody,
  validateParams,
} from '../../middlewares/validate.middleware';
import {
  attachmentParamsSchema,
  createLinkAttachmentSchema,
} from '../../validators/attachment.validator';
import { taskIdParamSchema } from '../../validators/task.validator';

export const taskAttachmentRoutes = Router({ mergeParams: true });

taskAttachmentRoutes.use(authenticate);

taskAttachmentRoutes.get(
  '/',
  validateParams(taskIdParamSchema),
  listTaskAttachments,
);

taskAttachmentRoutes.post(
  '/',
  validateParams(taskIdParamSchema),
  uploadTaskAttachment,
);

taskAttachmentRoutes.post(
  '/link',
  validateParams(taskIdParamSchema),
  validateBody(createLinkAttachmentSchema),
  createLinkTaskAttachment,
);

taskAttachmentRoutes.delete(
  '/:attachmentId',
  validateParams(attachmentParamsSchema),
  deleteTaskAttachment,
);
