import { Router } from 'express';
import {
  createColumn,
  deleteColumn,
  updateColumn,
} from '../../controllers/column.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  validateBody,
  validateParams,
} from '../../middlewares/validate.middleware';
import {
  columnBoardParamSchema,
  columnIdParamSchema,
  createColumnSchema,
  updateColumnSchema,
} from '../../validators/column.validator';

const boardColumnRouter = Router({ mergeParams: true });

boardColumnRouter.use(authenticate);
boardColumnRouter.post(
  '/',
  validateParams(columnBoardParamSchema),
  validateBody(createColumnSchema),
  createColumn,
);

const columnRouter = Router();
columnRouter.use(authenticate);
columnRouter.patch(
  '/:id',
  validateParams(columnIdParamSchema),
  validateBody(updateColumnSchema),
  updateColumn,
);
columnRouter.delete('/:id', validateParams(columnIdParamSchema), deleteColumn);

export { boardColumnRouter, columnRouter };
