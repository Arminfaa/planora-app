import { z } from 'zod';
import { objectIdSchema, paginationSchema } from '../utils/pagination';
import { sanitizeString } from '../utils/sanitize';
import { taskFilterQuerySchema } from './filter.validator';

export const searchQuerySchema = paginationSchema
  .extend({
    q: z
      .string()
      .max(100)
      .optional()
      .transform((value) => (value ? sanitizeString(value) : undefined)),
    projectId: objectIdSchema.optional(),
    boardId: objectIdSchema.optional(),
  })
  .merge(taskFilterQuerySchema)
  .refine(
    (data) =>
      (data.q?.length ?? 0) >= 2 ||
      Boolean(data.priority?.length || data.assigneeId || data.due),
    { message: 'Provide a search query (min 2 chars) or at least one filter' },
  );

export type SearchQuery = z.infer<typeof searchQuerySchema>;
