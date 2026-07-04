import { Router } from 'express';
import {
  createChecklistItem,
  deleteChecklistItem,
  listChecklistItems,
  updateChecklistItem,
} from '../../controllers/checklist.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  validateBody,
  validateParams,
} from '../../middlewares/validate.middleware';
import {
  checklistItemParamSchema,
  checklistTaskParamSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
} from '../../validators/checklist.validator';

const checklistRouter = Router({ mergeParams: true });

checklistRouter.use(authenticate);
checklistRouter.get(
  '/',
  validateParams(checklistTaskParamSchema),
  listChecklistItems,
);
checklistRouter.post(
  '/',
  validateParams(checklistTaskParamSchema),
  validateBody(createChecklistItemSchema),
  createChecklistItem,
);
checklistRouter.patch(
  '/:itemId',
  validateParams(checklistItemParamSchema),
  validateBody(updateChecklistItemSchema),
  updateChecklistItem,
);
checklistRouter.delete(
  '/:itemId',
  validateParams(checklistItemParamSchema),
  deleteChecklistItem,
);

export { checklistRouter };
