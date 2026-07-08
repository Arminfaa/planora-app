import { Router } from 'express';
import {
  createBoard,
  deleteBoard,
  getBoard,
  getBoardBySlug,
  listBoards,
  removeBoardBackground,
  updateBoard,
  uploadBoardBackground,
} from '../../controllers/board.controller';
import {
  createBoardTask,
  bulkMoveBoardTasks,
  listBoardTasks,
} from '../../controllers/task.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  validateBody,
  validateParams,
} from '../../middlewares/validate.middleware';
import {
  boardIdParamSchema,
  boardProjectParamSchema,
  boardProjectSlugParamSchema,
  createBoardSchema,
  updateBoardSchema,
} from '../../validators/board.validator';
import {
  createBoardTaskSchema,
  bulkMoveTasksSchema,
} from '../../validators/task.validator';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', validateParams(boardProjectParamSchema), listBoards);
router.post(
  '/',
  validateParams(boardProjectParamSchema),
  validateBody(createBoardSchema),
  createBoard,
);
router.get(
  '/:boardSlug',
  validateParams(boardProjectSlugParamSchema),
  getBoardBySlug,
);

const boardRouter = Router();
boardRouter.use(authenticate);
boardRouter.get(
  '/:id/tasks',
  validateParams(boardIdParamSchema),
  listBoardTasks,
);
boardRouter.post(
  '/:id/tasks/bulk-move',
  validateParams(boardIdParamSchema),
  validateBody(bulkMoveTasksSchema),
  bulkMoveBoardTasks,
);
boardRouter.post(
  '/:id/tasks',
  validateParams(boardIdParamSchema),
  validateBody(createBoardTaskSchema),
  createBoardTask,
);
boardRouter.get('/:id', validateParams(boardIdParamSchema), getBoard);
boardRouter.post(
  '/:id/background',
  validateParams(boardIdParamSchema),
  uploadBoardBackground,
);
boardRouter.delete(
  '/:id/background',
  validateParams(boardIdParamSchema),
  removeBoardBackground,
);
boardRouter.patch(
  '/:id',
  validateParams(boardIdParamSchema),
  validateBody(updateBoardSchema),
  updateBoard,
);
boardRouter.delete('/:id', validateParams(boardIdParamSchema), deleteBoard);

export { router as projectBoardRoutes, boardRouter };
