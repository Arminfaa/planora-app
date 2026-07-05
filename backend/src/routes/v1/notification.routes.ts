import { Router } from 'express';
import {
  getNotificationPreferences,
  getPushStatus,
  getUnreadNotificationCount,
  getVapidKey,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribePush,
  unsubscribePush,
  updateNotificationPreferences,
} from '../../controllers/notification.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  validateBody,
  validateParams,
} from '../../middlewares/validate.middleware';
import {
  notificationIdParamSchema,
  subscribePushSchema,
  unsubscribePushSchema,
  updateNotificationPreferencesSchema,
} from '../../validators/notification.validator';

const router = Router();

router.use(authenticate);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadNotificationCount);
router.patch('/read-all', markAllNotificationsRead);
router.patch(
  '/:id/read',
  validateParams(notificationIdParamSchema),
  markNotificationRead,
);

router.get('/push/vapid-key', getVapidKey);
router.get('/push/status', getPushStatus);
router.post(
  '/push/subscribe',
  validateBody(subscribePushSchema),
  subscribePush,
);
router.delete(
  '/push/subscribe',
  validateBody(unsubscribePushSchema),
  unsubscribePush,
);

router.get('/preferences', getNotificationPreferences);
router.patch(
  '/preferences',
  validateBody(updateNotificationPreferencesSchema),
  updateNotificationPreferences,
);

export default router;
