import { z } from 'zod';
import { objectIdSchema, paginationSchema } from '../utils/pagination';
import { sanitizeString } from '../utils/sanitize';

export const searchQuerySchema = paginationSchema.extend({
  q: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100)
    .transform(sanitizeString),
  projectId: objectIdSchema.optional(),
  boardId: objectIdSchema.optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
