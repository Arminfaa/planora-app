import type { Response } from 'express';
import { notificationService } from '../services/notification.service';
import { getVapidPublicKey } from '../services/push-notification.service';
import type { AuthenticatedRequest } from '../types';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getParam } from '../utils/params';
import {
  listNotificationsQuerySchema,
  pushStatusQuerySchema,
  type ListNotificationsQuery,
  type SubscribePushInput,
  type UnsubscribePushInput,
  type UpdateNotificationPreferencesInput,
} from '../validators/notification.validator';

export const listNotifications = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = listNotificationsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError(400, 'Validation failed');
    }

    const result = await notificationService.list(
      req.user!.userId,
      parsed.data as ListNotificationsQuery,
    );
    ApiResponse.success(res, result, 'Notifications retrieved');
  },
);

export const getUnreadNotificationCount = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const unreadCount = await notificationService.getUnreadCount(
      req.user!.userId,
    );
    ApiResponse.success(res, { unreadCount }, 'Unread count retrieved');
  },
);

export const markNotificationRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await notificationService.markRead(
      req.user!.userId,
      getParam(req.params, 'id'),
    );
    ApiResponse.success(res, result, 'Notification marked as read');
  },
);

export const markAllNotificationsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await notificationService.markAllRead(req.user!.userId);
    ApiResponse.success(res, result, 'All notifications marked as read');
  },
);

export const getVapidKey = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response) => {
    const publicKey = getVapidPublicKey();
    ApiResponse.success(res, { publicKey }, 'VAPID public key retrieved');
  },
);

export const subscribePush = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await notificationService.subscribePush(
      req.user!.userId,
      req.body as SubscribePushInput,
    );
    ApiResponse.success(res, result, 'Push subscription saved', 201);
  },
);

export const unsubscribePush = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await notificationService.unsubscribePush(
      req.user!.userId,
      req.body as UnsubscribePushInput,
    );
    ApiResponse.success(res, result, 'Push subscription removed');
  },
);

export const getPushStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = pushStatusQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError(400, 'Validation failed');
    }

    const status = await notificationService.getPushStatus(
      req.user!.userId,
      parsed.data.endpoint,
    );
    ApiResponse.success(res, status, 'Push status retrieved');
  },
);

export const getNotificationPreferences = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const preferences = await notificationService.getPreferences(
      req.user!.userId,
    );
    ApiResponse.success(res, preferences, 'Notification preferences retrieved');
  },
);

export const updateNotificationPreferences = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const preferences = await notificationService.updatePreferences(
      req.user!.userId,
      req.body as UpdateNotificationPreferencesInput,
    );
    ApiResponse.success(res, preferences, 'Notification preferences updated');
  },
);
