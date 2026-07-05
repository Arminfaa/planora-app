import webpush from 'web-push';
import { env } from '../config/env';
import { pushSubscriptionRepository } from '../repositories/push-subscription.repository';
import { logger } from '../utils/logger';

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return false;
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  vapidConfigured = true;
  return true;
}

export function getVapidPublicKey(): string | null {
  return env.VAPID_PUBLIC_KEY ?? null;
}

export interface PushPayload {
  title: string;
  body: string;
  href: string;
  notificationId?: string;
  tag?: string;
}

function appendNotificationId(href: string, notificationId: string): string {
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}notificationId=${encodeURIComponent(notificationId)}`;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  if (!ensureVapidConfigured()) {
    logger.debug('Web push skipped: VAPID keys are not configured');
    return;
  }

  const subscriptions = await pushSubscriptionRepository.findByUser(userId);
  if (subscriptions.length === 0) return;

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    href: payload.notificationId
      ? appendNotificationId(payload.href, payload.notificationId)
      : payload.href,
    notificationId: payload.notificationId,
    tag: payload.tag,
  });

  const expiredIds: string[] = [];

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          pushPayload,
        );
      } catch (error) {
        const statusCode =
          error && typeof error === 'object' && 'statusCode' in error
            ? Number((error as { statusCode: number }).statusCode)
            : null;

        if (statusCode === 404 || statusCode === 410) {
          expiredIds.push(subscription.id);
          return;
        }

        logger.warn('Failed to send web push notification', {
          userId,
          subscriptionId: subscription.id,
          statusCode,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }),
  );

  if (expiredIds.length > 0) {
    await pushSubscriptionRepository.deleteByIdList(expiredIds);
  }
}
