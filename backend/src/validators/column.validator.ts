import { z } from 'zod';
import { objectIdSchema } from '../utils/pagination';
import { sanitizeString } from '../utils/sanitize';

export const columnIdParamSchema = z.object({
  id: objectIdSchema,
});

export const columnBoardParamSchema = z.object({
  boardId: objectIdSchema,
});

export const createColumnSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50).transform(sanitizeString),
  position: z.coerce.number().int().min(0).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code')
    .optional(),
});

export const updateColumnSchema = createColumnSchema.partial();

export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
