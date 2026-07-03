import { Router } from 'express';
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from '../../controllers/project.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../middlewares/validate.middleware';
import {
  createProjectSchema,
  projectListQuerySchema,
  projectParamsSchema,
  updateProjectSchema,
} from '../../validators/project.validator';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(projectListQuerySchema), listProjects);
router.post('/', validateBody(createProjectSchema), createProject);
router.get('/:id', validateParams(projectParamsSchema), getProject);
router.patch(
  '/:id',
  validateParams(projectParamsSchema),
  validateBody(updateProjectSchema),
  updateProject,
);
router.delete('/:id', validateParams(projectParamsSchema), deleteProject);

export default router;
