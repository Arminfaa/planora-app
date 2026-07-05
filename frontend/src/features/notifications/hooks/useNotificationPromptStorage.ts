'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  clearNotificationPromptRecord,
  readNotificationPromptRecord,
  setNotificationPromptDecision,
  type NotificationPromptRecord,
} from '../lib/notification-prompt-storage';

export function useNotificationPromptStorage(userId: string | undefined) {
  const [record, setRecord] = useState<NotificationPromptRecord>({
    v: 1,
    decision: 'none',
  });

  useEffect(() => {
    if (!userId) {
      setRecord({ v: 1, decision: 'none' });
      return;
    }

    setRecord(readNotificationPromptRecord(userId));
  }, [userId]);

  const markOptedIn = useCallback(() => {
    if (!userId) return;
    const next: NotificationPromptRecord = { v: 1, decision: 'opted_in' };
    setNotificationPromptDecision(userId, 'opted_in');
    setRecord(next);
  }, [userId]);

  const markOptedOut = useCallback(() => {
    if (!userId) return;
    const next: NotificationPromptRecord = { v: 1, decision: 'opted_out' };
    setNotificationPromptDecision(userId, 'opted_out');
    setRecord(next);
  }, [userId]);

  const clearRecord = useCallback(() => {
    if (!userId) return;
    clearNotificationPromptRecord(userId);
    setRecord({ v: 1, decision: 'none' });
  }, [userId]);

  return { record, markOptedIn, markOptedOut, clearRecord };
}
