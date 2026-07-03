import { z } from 'zod';
import { objectIdSchema } from '../utils/pagination';
import { taskIdParamSchema } from './task.validator';

export const attachmentParamsSchema = taskIdParamSchema.extend({
  attachmentId: objectIdSchema,
});

export type AttachmentParams = z.infer<typeof attachmentParamsSchema>;
