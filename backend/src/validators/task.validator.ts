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
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  assigneeIds: z.array(objectIdSchema).optional(),
});

export const createBoardTaskSchema = createTaskSchema.extend({
  columnId: objectIdSchema.optional(),
});

export const updateTaskSchema = createTaskSchema
  .partial()
  .extend({
    columnId: objectIdSchema.optional(),
    assigneeIds: z.array(objectIdSchema).optional(),
    startDate: z.coerce.date().nullable().optional(),
    dueDate: z.coerce.date().nullable().optional(),
    completeDate: z.coerce.date().nullable().optional(),
    progress: z.coerce.number().int().min(0).max(100).optional(),
    parentTaskId: objectIdSchema.nullable().optional(),
    isCompleted: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.dueDate) return true;
      return data.startDate.getTime() <= data.dueDate.getTime();
    },
    { message: 'Start date must be before or equal to due date' },
  );

export const taskListQuerySchema = paginationSchema;

export const bulkMoveTasksSchema = z.object({
  taskIds: z.array(objectIdSchema).min(1).max(500),
  columnId: objectIdSchema,
});

const bulkTaskIdsSchema = z.array(objectIdSchema).min(1).max(500);

export const bulkTaskActionSchema = z.object({
  taskIds: bulkTaskIdsSchema,
  action: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('move'),
      columnId: objectIdSchema,
    }),
    z.object({
      type: z.literal('setDueDate'),
      dueDate: z.coerce.date().nullable(),
    }),
    z.object({
      type: z.literal('setStartDate'),
      startDate: z.coerce.date().nullable(),
    }),
    z.object({
      type: z.literal('setCompleteDate'),
      completeDate: z.coerce.date().nullable(),
    }),
    z.object({
      type: z.literal('setAssignees'),
      assigneeIds: z.array(objectIdSchema),
    }),
    z.object({
      type: z.literal('setPriority'),
      priority: z.nativeEnum(TaskPriority),
    }),
    z.object({
      type: z.literal('setCompleted'),
      isCompleted: z.boolean(),
    }),
    z.object({
      type: z.literal('setProgress'),
      progress: z.coerce.number().int().min(0).max(100),
    }),
    z.object({
      type: z.literal('addLabels'),
      labelIds: z.array(objectIdSchema).min(1),
    }),
    z.object({
      type: z.literal('removeLabels'),
      labelIds: z.array(objectIdSchema).min(1),
    }),
    z.object({
      type: z.literal('setLabels'),
      labelIds: z.array(objectIdSchema),
    }),
    z.object({
      type: z.literal('addChecklistItem'),
      title: z
        .string()
        .min(1, 'Title is required')
        .max(200)
        .transform(sanitizeString),
      weight: z.coerce.number().int().min(1).max(10).optional(),
    }),
    z.object({
      type: z.literal('delete'),
    }),
  ]),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateBoardTaskInput = z.infer<typeof createBoardTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type BulkMoveTasksInput = z.infer<typeof bulkMoveTasksSchema>;
export type BulkTaskActionInput = z.infer<typeof bulkTaskActionSchema>;
