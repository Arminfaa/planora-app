/* eslint-disable no-restricted-globals */

const LOCALE_COOKIE = 'app-locale';

const DEFAULT_NOTIFICATION_TITLES = {
  en: 'Notification',
  fa: 'اعلان',
};

function readLocaleFromCookie() {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`),
  );
  return match?.[1] === 'fa' ? 'fa' : 'en';
}

function defaultNotificationTitle() {
  const locale = readLocaleFromCookie();
  return DEFAULT_NOTIFICATION_TITLES[locale] ?? DEFAULT_NOTIFICATION_TITLES.en;
}

self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() ?? '' };
  }

  const data = payload;
  const title =
    typeof data.title === 'string' ? data.title : defaultNotificationTitle();
  const body = typeof data.body === 'string' ? data.body : '';
  const href = typeof data.href === 'string' ? data.href : '/dashboard/notifications';
  const tag =
    typeof data.tag === 'string'
      ? data.tag
      : typeof data.notificationId === 'string'
        ? data.notificationId
        : undefined;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/logo.webp',
      badge: '/logo.webp',
      tag,
      data: {
        href,
        notificationId: data.notificationId ?? null,
      },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const href = event.notification.data?.href ?? '/dashboard/notifications';
  const targetUrl = new URL(href, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (!client.url.startsWith(self.location.origin)) continue;

          if ('focus' in client) {
            if ('navigate' in client && typeof client.navigate === 'function') {
              return client.navigate(targetUrl).then(() => client.focus());
            }

            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              href,
            });
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }

        return undefined;
      }),
  );
});

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
