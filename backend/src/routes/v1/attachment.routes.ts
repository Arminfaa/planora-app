import { Router } from 'express';
import {
  deleteTaskAttachment,
  listTaskAttachments,
  uploadTaskAttachment,
} from '../../controllers/attachment.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateParams } from '../../middlewares/validate.middleware';
import { attachmentParamsSchema } from '../../validators/attachment.validator';
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

taskAttachmentRoutes.delete(
  '/:attachmentId',
  validateParams(attachmentParamsSchema),
  deleteTaskAttachment,
);
