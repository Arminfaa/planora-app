import { Router } from 'express';
import {
  createProjectDependency,
  deleteProjectDependency,
  listProjectDependencies,
} from '../../controllers/task-dependency.controller';
import {
  createProject,
  deleteProject,
  getPermissionCatalog,
  getProject,
  getProjectGantt,
  getProjectProgress,
  getProjectTasks,
  listProjects,
  updateProject,
} from '../../controllers/project.controller';
import {
  createTaskDependencySchema,
  projectDependencyIdParamsSchema,
  projectDependencyParamsSchema,
} from '../../validators/task-dependency.validator';
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

router.get('/permissions', getPermissionCatalog);
router.get('/', validateQuery(projectListQuerySchema), listProjects);
router.post('/', validateBody(createProjectSchema), createProject);
router.get(
  '/:id/progress',
  validateParams(projectParamsSchema),
  getProjectProgress,
);
router.get('/:id/gantt', validateParams(projectParamsSchema), getProjectGantt);
router.get('/:id/tasks', validateParams(projectParamsSchema), getProjectTasks);
router.get(
  '/:id/dependencies',
  validateParams(projectDependencyParamsSchema),
  listProjectDependencies,
);
router.post(
  '/:id/dependencies',
  validateParams(projectDependencyParamsSchema),
  validateBody(createTaskDependencySchema),
  createProjectDependency,
);
router.delete(
  '/:id/dependencies/:dependencyId',
  validateParams(projectDependencyIdParamsSchema),
  deleteProjectDependency,
);
router.get('/:id', validateParams(projectParamsSchema), getProject);
router.patch(
  '/:id',
  validateParams(projectParamsSchema),
  validateBody(updateProjectSchema),
  updateProject,
);
router.delete('/:id', validateParams(projectParamsSchema), deleteProject);

export default router;
