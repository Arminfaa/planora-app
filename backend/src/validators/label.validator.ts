import { z } from 'zod';
import { objectIdSchema } from '../utils/pagination';
import { projectParamsSchema } from './project.validator';
import { sanitizeString } from '../utils/sanitize';

export const labelParamsSchema = projectParamsSchema.extend({
  labelId: objectIdSchema,
});

export const createLabelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(30).transform(sanitizeString),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code')
    .default('#6B7280'),
});

export const updateLabelSchema = createLabelSchema.partial();

export const assignTaskLabelSchema = z.object({
  labelId: objectIdSchema,
});

export const taskLabelParamsSchema = z.object({
  id: objectIdSchema,
  labelId: objectIdSchema,
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
