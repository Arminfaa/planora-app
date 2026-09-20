import { z } from 'zod';
import { objectIdSchema } from '../utils/pagination';
import { sanitizeString } from '../utils/sanitize';

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format');

const projectIdentifierSchema = z.union([objectIdSchema, slugSchema]);

export const boardIdParamSchema = z.object({
  id: objectIdSchema,
});

export const boardProjectParamSchema = z.object({
  projectId: projectIdentifierSchema,
});

export const boardProjectSlugParamSchema = z.object({
  projectId: projectIdentifierSchema,
  boardSlug: z.union([objectIdSchema, slugSchema]),
});

const boardColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code')
  .nullable();

export const createBoardSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .transform(sanitizeString),
  position: z.coerce.number().int().min(0).optional(),
  color: boardColorSchema.optional(),
  isCompleted: z.boolean().optional(),
});

export const updateBoardSchema = createBoardSchema.partial();

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
