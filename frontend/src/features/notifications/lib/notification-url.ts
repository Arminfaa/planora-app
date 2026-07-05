export function appendNotificationId(
  href: string,
  notificationId: string,
): string {
  const [path, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  params.set('notificationId', notificationId);
  const nextQuery = params.toString();
  return nextQuery ? `${path}?${nextQuery}` : path;
}

export function stripNotificationId(href: string): string {
  const [path, query = ''] = href.split('?');
  if (!query) return path;

  const params = new URLSearchParams(query);
  params.delete('notificationId');
  const nextQuery = params.toString();
  return nextQuery ? `${path}?${nextQuery}` : path;
}
