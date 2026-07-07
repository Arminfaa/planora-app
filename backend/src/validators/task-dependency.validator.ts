import { z } from 'zod';

export const projectDependencyParamsSchema = z.object({
  id: z.string().min(1),
});

export const projectDependencyIdParamsSchema = z.object({
  id: z.string().min(1),
  dependencyId: z.string().min(1),
});

export const taskDependencyParamsSchema = z.object({
  id: z.string().min(1),
});

export const createTaskDependencySchema = z.object({
  fromTaskId: z.string().min(1),
  toTaskId: z.string().min(1),
});

export type CreateTaskDependencyInput = z.infer<
  typeof createTaskDependencySchema
>;
