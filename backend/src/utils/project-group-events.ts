import { emitProjectEvent } from '../socket';
import type { ProjectEventType } from '../socket/types';

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
}
