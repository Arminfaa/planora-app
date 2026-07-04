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
  assigneeIds: z.array(objectIdSchema).optional(),
});

export const createBoardTaskSchema = createTaskSchema.extend({
  columnId: objectIdSchema.optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  columnId: objectIdSchema.optional(),
  assigneeIds: z.array(objectIdSchema).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  isCompleted: z.boolean().optional(),
});

export const taskListQuerySchema = paginationSchema;

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateBoardTaskInput = z.infer<typeof createBoardTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
