import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  validateBody,
  validateParams,
} from '../../middlewares/validate.middleware';
import {
  createRoleDefinition,
  deleteRoleDefinition,
  listRoleDefinitions,
  updateRoleDefinition,
} from '../../controllers/role-definition.controller';
import { projectParamsSchema } from '../../validators/project.validator';
import {
  createRoleDefinitionSchema,
  roleDefinitionParamsSchema,
  updateRoleDefinitionSchema,
} from '../../validators/role-definition.validator';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', validateParams(projectParamsSchema), listRoleDefinitions);

router.post(
  '/',
  validateParams(projectParamsSchema),
  validateBody(createRoleDefinitionSchema),
  createRoleDefinition,
);

router.patch(
  '/:roleId',
  validateParams(roleDefinitionParamsSchema),
  validateBody(updateRoleDefinitionSchema),
  updateRoleDefinition,
);

router.delete(
  '/:roleId',
  validateParams(roleDefinitionParamsSchema),
  deleteRoleDefinition,
);

export default router;
