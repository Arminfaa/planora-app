import { Router } from 'express';
import {
  createGroupMessage,
  createGroupMessageWithFile,
  deleteGroupMessage,
  listGroupMessages,
  updateGroupMessage,
} from '../../controllers/project-group.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { uploadMiddleware } from '../../middlewares/upload.middleware';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../middlewares/validate.middleware';
import { projectParamsSchema } from '../../validators/project.validator';
import {
  createGroupMessageSchema,
  groupMessageParamsSchema,
  listGroupMessagesQuerySchema,
  updateGroupMessageSchema,
} from '../../validators/project-group.validator';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get(
  '/',
  validateParams(projectParamsSchema),
  validateQuery(listGroupMessagesQuerySchema),
  listGroupMessages,
);

router.post(
  '/',
  validateParams(projectParamsSchema),
  validateBody(createGroupMessageSchema),
  createGroupMessage,
);

router.post(
  '/upload',
  validateParams(projectParamsSchema),
  uploadMiddleware,
  createGroupMessageWithFile,
);

router.patch(
  '/:messageId',
  validateParams(groupMessageParamsSchema),
  validateBody(updateGroupMessageSchema),
  updateGroupMessage,
);

router.delete(
  '/:messageId',
  validateParams(groupMessageParamsSchema),
  deleteGroupMessage,
);

export default router;
