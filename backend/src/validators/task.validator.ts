import { TaskPriority } from '@prisma/client';
import { z } from 'zod';
import { objectIdSchema, paginationSchema } from '../utils/pagination';
import { sanitizeString } from '../utils/sanitize';

export const taskIdParamSchema = z.object({
  id: objectIdSchema,
});

export const taskColumnParamSchema = z.object({
  columnId: objectIdSchema,
});

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200)
    .transform(sanitizeString),
  description: z
    .string()
    .max(2000)
    .optional()
    .transform((v) => (v ? sanitizeString(v) : undefined)),
  position: z.coerce.number().int().min(0).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.coerce.date().optional(),
  assigneeId: objectIdSchema.optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  columnId: objectIdSchema.optional(),
  assigneeId: objectIdSchema.nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

export const taskListQuerySchema = paginationSchema;

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
