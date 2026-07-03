import { z } from 'zod';
import { objectIdSchema, paginationSchema } from '../utils/pagination';
import { sanitizeString } from '../utils/sanitize';

export const projectIdParamSchema = z.object({
  projectId: objectIdSchema,
});

export const projectParamsSchema = z.object({
  id: z.union([
    objectIdSchema,
    z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  ]),
});

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .transform(sanitizeString),
  description: z
    .string()
    .max(500)
    .optional()
    .transform((v) => (v ? sanitizeString(v) : undefined)),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectListQuerySchema = paginationSchema;

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
