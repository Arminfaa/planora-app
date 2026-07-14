import { z } from 'zod';
import { objectIdSchema } from '../utils/pagination';
import { sanitizeString } from '../utils/sanitize';
import { taskIdParamSchema } from './task.validator';

export const checklistTaskParamSchema = taskIdParamSchema;

export const checklistItemParamSchema = taskIdParamSchema.extend({
  itemId: objectIdSchema,
});

export const createChecklistItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500)
    .transform(sanitizeString),
  weight: z.coerce.number().int().min(1).max(10).optional(),
});

export const updateChecklistItemSchema = z.object({
  title: z.string().min(1).max(500).transform(sanitizeString).optional(),
  isDone: z.boolean().optional(),
  weight: z.coerce.number().int().min(1).max(10).optional(),
  position: z.coerce.number().int().min(0).optional(),
});

export type CreateChecklistItemInput = z.infer<
  typeof createChecklistItemSchema
>;
export type UpdateChecklistItemInput = z.infer<
  typeof updateChecklistItemSchema
>;
