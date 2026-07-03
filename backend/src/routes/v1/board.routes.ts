import { Router } from 'express';
import {
  createBoard,
  deleteBoard,
  getBoard,
  getBoardBySlug,
  listBoards,
  updateBoard,
} from '../../controllers/board.controller';
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
boardRouter.get('/:id', validateParams(boardIdParamSchema), getBoard);
boardRouter.patch(
  '/:id',
  validateParams(boardIdParamSchema),
  validateBody(updateBoardSchema),
  updateBoard,
);
boardRouter.delete('/:id', validateParams(boardIdParamSchema), deleteBoard);

export { router as projectBoardRoutes, boardRouter };
