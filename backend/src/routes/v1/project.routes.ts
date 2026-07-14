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
  createHoliday,
  createLeave,
  deleteHoliday,
  deleteLeave,
  getPersonCompletions,
  getWorkingCalendar,
  updateWorkingWeekdays,
} from '../../controllers/working-calendar.controller';
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
import {
  completionsQuerySchema,
  createHolidaySchema,
  createLeaveSchema,
  holidayParamsSchema,
  leaveParamsSchema,
  updateWorkingWeekdaysSchema,
  workingCalendarParamsSchema,
} from '../../validators/working-calendar.validator';

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
router.get(
  '/:id/working-calendar',
  validateParams(workingCalendarParamsSchema),
  getWorkingCalendar,
);
router.patch(
  '/:id/working-calendar/weekdays',
  validateParams(workingCalendarParamsSchema),
  validateBody(updateWorkingWeekdaysSchema),
  updateWorkingWeekdays,
);
router.post(
  '/:id/holidays',
  validateParams(workingCalendarParamsSchema),
  validateBody(createHolidaySchema),
  createHoliday,
);
router.delete(
  '/:id/holidays/:holidayId',
  validateParams(holidayParamsSchema),
  deleteHoliday,
);
router.post(
  '/:id/leaves',
  validateParams(workingCalendarParamsSchema),
  validateBody(createLeaveSchema),
  createLeave,
);
router.delete(
  '/:id/leaves/:leaveId',
  validateParams(leaveParamsSchema),
  deleteLeave,
);
router.get(
  '/:id/analytics/completions',
  validateParams(projectParamsSchema),
  validateQuery(completionsQuerySchema),
  getPersonCompletions,
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
