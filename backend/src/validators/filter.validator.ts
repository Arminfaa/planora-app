import { z } from 'zod';

export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const dueDateFilterSchema = z.enum(['overdue', 'today', 'week', 'none']);

const priorityInputSchema = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [value];
}, z.array(taskPrioritySchema).optional());

export const taskFilterQuerySchema = z.object({
  priority: priorityInputSchema,
  assigneeId: z
    .union([z.literal('unassigned'), z.string().regex(/^[0-9a-fA-F]{24}$/)])
    .optional(),
  due: dueDateFilterSchema.optional(),
});

export type TaskFilterQuery = z.infer<typeof taskFilterQuerySchema>;
