import { z } from 'zod';
import { objectIdSchema } from '../utils/pagination';
import { taskIdParamSchema } from './task.validator';

export const attachmentParamsSchema = taskIdParamSchema.extend({
  attachmentId: objectIdSchema,
});

export const createLinkAttachmentSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  filename: z.string().trim().min(1).max(255).optional(),
});

export type AttachmentParams = z.infer<typeof attachmentParamsSchema>;
export type CreateLinkAttachmentInput = z.infer<
  typeof createLinkAttachmentSchema
>;
