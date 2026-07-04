import { z } from 'zod';
import { objectIdSchema, paginationSchema } from '../utils/pagination';
import { projectParamsSchema } from './project.validator';
import { sanitizeString } from '../utils/sanitize';

export const groupMessageParamsSchema = projectParamsSchema.extend({
  messageId: objectIdSchema,
});

export const listGroupMessagesQuerySchema = paginationSchema.extend({
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export const createGroupMessageSchema = z.object({
  content: z.string().max(4000).transform(sanitizeString).optional(),
});

export const updateGroupMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message content is required')
    .max(4000)
    .transform(sanitizeString),
});

export type CreateGroupMessageInput = z.infer<typeof createGroupMessageSchema>;
export type UpdateGroupMessageInput = z.infer<typeof updateGroupMessageSchema>;
