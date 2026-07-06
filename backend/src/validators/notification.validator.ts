import { z } from 'zod';
import { NotificationType } from '@prisma/client';
import { objectIdSchema, paginationSchema } from '../utils/pagination';

export const listNotificationsQuerySchema = paginationSchema.extend({
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export const subscribePushSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().max(512).optional(),
});

export const unsubscribePushSchema = z.object({
  endpoint: z.string().url().max(2048),
});

export const updateNotificationPreferencesSchema = z.object({
  taskChanges: z.boolean().optional(),
  groupMessages: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
});

export const notificationIdParamSchema = z.object({
  id: objectIdSchema,
});

export const projectNotificationReadParamSchema = z.object({
  projectId: objectIdSchema,
});

export const markProjectNotificationsReadQuerySchema = z.object({
  type: z.nativeEnum(NotificationType).optional(),
});

export const pushStatusQuerySchema = z.object({
  endpoint: z.string().url().max(2048).optional(),
});

export type ListNotificationsQuery = z.infer<
  typeof listNotificationsQuerySchema
>;
export type SubscribePushInput = z.infer<typeof subscribePushSchema>;
export type UnsubscribePushInput = z.infer<typeof unsubscribePushSchema>;
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
export type PushStatusQuery = z.infer<typeof pushStatusQuerySchema>;
export type MarkProjectNotificationsReadQuery = z.infer<
  typeof markProjectNotificationsReadQuerySchema
>;
