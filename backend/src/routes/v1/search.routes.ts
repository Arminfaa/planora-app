import { Router } from 'express';
import { search } from '../../controllers/search.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateQuery } from '../../middlewares/validate.middleware';
import { searchQuerySchema } from '../../validators/search.validator';

const router = Router();

router.use(authenticate);
router.get('/', validateQuery(searchQuerySchema), search);

export default router;
