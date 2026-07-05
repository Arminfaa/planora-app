'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { connectSocket } from '@/lib/socket';
import { notificationService } from '../services/notification.service';
import type { AppNotification, NotificationSocketEvent } from '../types';
import { appendNotificationId } from '../lib/notification-url';
import {
  getNotificationPermission,
  isPushSupported,
  registerServiceWorker,
  requestNotificationPermission,
  showForegroundNotification,
  subscribeToPush,
} from '../lib/push-client';

interface NotificationContextValue {
  unreadCount: number;
  isLoading: boolean;
  permission: NotificationPermission | 'unsupported';
  isPushSupported: boolean;
  enableNotifications: () => Promise<boolean>;
  enablePushForAccount: () => Promise<boolean>;
  refreshUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  handleNotificationClick: (notification: AppNotification) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<
    NotificationPermission | 'unsupported'
  >('default');

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    const count = await notificationService.getUnreadCount();
    setUnreadCount(count);
  }, [isAuthenticated]);

  const setupPushSubscription = useCallback(async () => {
    if (!isPushSupported()) return false;

    const publicKey = await notificationService.getVapidPublicKey();
    if (!publicKey) return false;

    const registration = await registerServiceWorker();
    if (!registration) return false;

    const subscription = await subscribeToPush(registration, publicKey);
    if (!subscription) return false;

    await notificationService.subscribePush(subscription.toJSON());
    return true;
  }, []);

  const enablePushForAccount = useCallback(async () => {
    if (!isPushSupported()) return false;
    if (Notification.permission !== 'granted') return false;

    try {
      const subscribed = await setupPushSubscription();
      if (!subscribed) return false;

      showForegroundNotification('Notifications enabled', {
        body: 'Push alerts are now active for your account on this device.',
        href: '/dashboard/notifications',
      });
      return true;
    } catch {
      return false;
    }
  }, [setupPushSubscription]);

  const enableNotifications = useCallback(async () => {
    if (!isPushSupported()) return false;

    const nextPermission = await requestNotificationPermission();
    setPermission(nextPermission);

    if (nextPermission !== 'granted') {
      return false;
    }

    return enablePushForAccount();
  }, [enablePushForAccount]);

  const markRead = useCallback(async (id: string) => {
    const result = await notificationService.markRead(id);
    setUnreadCount(result.unreadCount);
  }, []);

  const markAllRead = useCallback(async () => {
    const result = await notificationService.markAllRead();
    setUnreadCount(result.unreadCount);
  }, []);

  const handleNotificationClick = useCallback(
    (notification: AppNotification) => {
      router.push(appendNotificationId(notification.href, notification.id));
    },
    [router],
  );

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const currentPermission = isPushSupported()
          ? await getNotificationPermission()
          : 'unsupported';
        if (!cancelled) {
          setPermission(currentPermission);
        }

        await refreshUnreadCount();
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, refreshUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = connectSocket();
    if (!socket) return;

    const handleNotificationEvent = (event: NotificationSocketEvent) => {
      if (event.type === 'notification:created') {
        setUnreadCount(event.unreadCount);
        showForegroundNotification(event.notification.title, {
          body: event.notification.body,
          tag: event.notification.id,
          href: appendNotificationId(
            event.notification.href,
            event.notification.id,
          ),
          data: {
            href: appendNotificationId(
              event.notification.href,
              event.notification.id,
            ),
            notificationId: event.notification.id,
          },
        });
        return;
      }

      setUnreadCount(event.unreadCount);
    };

    socket.on('notification:event', handleNotificationEvent);

    return () => {
      socket.off('notification:event', handleNotificationEvent);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; href?: string } | null;
      if (data?.type === 'NOTIFICATION_CLICK' && data.href) {
        router.push(data.href);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [router]);

  const value = useMemo(
    () => ({
      unreadCount,
      isLoading,
      permission,
      isPushSupported: isPushSupported(),
      enableNotifications,
      enablePushForAccount,
      refreshUnreadCount,
      markRead,
      markAllRead,
      handleNotificationClick,
    }),
    [
      unreadCount,
      isLoading,
      permission,
      enableNotifications,
      enablePushForAccount,
      refreshUnreadCount,
      markRead,
      markAllRead,
      handleNotificationClick,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within NotificationProvider',
    );
  }
  return context;
}
