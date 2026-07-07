import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from '../../controllers/task.controller';
import { listTaskDependencies } from '../../controllers/task-dependency.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../middlewares/validate.middleware';
import {
  createTaskSchema,
  taskColumnParamSchema,
  taskIdParamSchema,
  taskListQuerySchema,
  updateTaskSchema,
} from '../../validators/task.validator';
import { taskDependencyParamsSchema } from '../../validators/task-dependency.validator';

const columnTaskRouter = Router({ mergeParams: true });

columnTaskRouter.use(authenticate);
columnTaskRouter.get(
  '/',
  validateParams(taskColumnParamSchema),
  validateQuery(taskListQuerySchema),
  listTasks,
);
columnTaskRouter.post(
  '/',
  validateParams(taskColumnParamSchema),
  validateBody(createTaskSchema),
  createTask,
);

const taskRouter = Router();
taskRouter.use(authenticate);
taskRouter.get('/:id', validateParams(taskIdParamSchema), getTask);
taskRouter.get(
  '/:id/dependencies',
  validateParams(taskDependencyParamsSchema),
  listTaskDependencies,
);
taskRouter.patch(
  '/:id',
  validateParams(taskIdParamSchema),
  validateBody(updateTaskSchema),
  updateTask,
);
taskRouter.delete('/:id', validateParams(taskIdParamSchema), deleteTask);

export { columnTaskRouter, taskRouter };
