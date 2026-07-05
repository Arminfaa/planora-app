import { emitProjectEvent } from '../socket';
import type { ProjectEventType } from '../socket/types';
import { dispatchProjectGroupMessageNotifications } from '../services/notification-dispatch.service';

export function notifyProjectGroupMessageEvent(
  userId: string,
  type: Extract<
    ProjectEventType,
    'group:message:created' | 'group:message:updated' | 'group:message:deleted'
  >,
  options: {
    projectId: string;
    payload: unknown;
  },
): void {
  emitProjectEvent({
    projectId: options.projectId,
    type,
    userId,
    payload: options.payload,
  });

  void dispatchProjectGroupMessageNotifications(userId, type, {
    projectId: options.projectId,
    payload: options.payload,
  }).catch(() => undefined);
}
