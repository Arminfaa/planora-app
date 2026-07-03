import { z } from 'zod';
import { objectIdSchema } from '../utils/pagination';
import { taskIdParamSchema } from './task.validator';
import { sanitizeString } from '../utils/sanitize';

export const commentParamsSchema = taskIdParamSchema.extend({
  commentId: objectIdSchema,
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment is required')
    .max(2000)
    .transform(sanitizeString),
});

export const updateCommentSchema = createCommentSchema;

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
