export type NotificationPromptDecision =
  'none' | 'opted_in' | 'opted_out' | 'snoozed';

export interface NotificationPromptRecord {
  v: 1;
  decision: NotificationPromptDecision;
  snoozedUntil?: string;
}

export type NotificationPromptBannerVariant =
  'none' | 'full' | 'account' | 'blocked';

const KEY_PREFIX = 'notification_prompt:v1:';
const LEGACY_KEY_PREFIX = 'notification_prompt_';
const SESSION_DISMISS_PREFIX = 'notification_session_dismissed:v1:';

function storageKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

function legacyStorageKey(userId: string): string {
  return `${LEGACY_KEY_PREFIX}${userId}`;
}

function sessionDismissKey(userId: string): string {
  return `${SESSION_DISMISS_PREFIX}${userId}`;
}

function safeStorageOp<T>(operation: () => T, fallback: T): T {
  try {
    return operation();
  } catch {
    return fallback;
  }
}

function parseRecord(raw: string): NotificationPromptRecord | null {
  try {
    const parsed = JSON.parse(raw) as Partial<NotificationPromptRecord>;
    if (parsed.v !== 1) return null;
    if (
      parsed.decision !== 'none' &&
      parsed.decision !== 'opted_in' &&
      parsed.decision !== 'opted_out' &&
      parsed.decision !== 'snoozed'
    ) {
      return null;
    }

    return {
      v: 1,
      decision: parsed.decision,
      snoozedUntil:
        typeof parsed.snoozedUntil === 'string'
          ? parsed.snoozedUntil
          : undefined,
    };
  } catch {
    return null;
  }
}

function migrateLegacyStatus(userId: string): NotificationPromptRecord | null {
  const legacy = safeStorageOp(
    () => localStorage.getItem(legacyStorageKey(userId)),
    null,
  );

  if (legacy === 'granted') {
    const record: NotificationPromptRecord = { v: 1, decision: 'opted_in' };
    writeNotificationPromptRecord(userId, record);
    safeStorageOp(
      () => localStorage.removeItem(legacyStorageKey(userId)),
      undefined,
    );
    return record;
  }

  if (legacy === 'declined') {
    const record: NotificationPromptRecord = { v: 1, decision: 'opted_out' };
    writeNotificationPromptRecord(userId, record);
    safeStorageOp(
      () => localStorage.removeItem(legacyStorageKey(userId)),
      undefined,
    );
    return record;
  }

  if (legacy !== null) {
    safeStorageOp(
      () => localStorage.removeItem(legacyStorageKey(userId)),
      undefined,
    );
  }

  return null;
}

export function readNotificationPromptRecord(
  userId: string,
): NotificationPromptRecord {
  if (typeof window === 'undefined') {
    return { v: 1, decision: 'none' };
  }

  const raw = safeStorageOp(
    () => localStorage.getItem(storageKey(userId)),
    null,
  );

  if (raw) {
    const parsed = parseRecord(raw);
    if (parsed) return parsed;
    safeStorageOp(() => localStorage.removeItem(storageKey(userId)), undefined);
  }

  return migrateLegacyStatus(userId) ?? { v: 1, decision: 'none' };
}

export function writeNotificationPromptRecord(
  userId: string,
  record: NotificationPromptRecord,
): void {
  if (typeof window === 'undefined') return;
  safeStorageOp(
    () => localStorage.setItem(storageKey(userId), JSON.stringify(record)),
    undefined,
  );
}

export function setNotificationPromptDecision(
  userId: string,
  decision: NotificationPromptDecision,
  options?: { snoozedUntil?: string },
): void {
  writeNotificationPromptRecord(userId, {
    v: 1,
    decision,
    snoozedUntil: options?.snoozedUntil,
  });
}

export function clearNotificationPromptRecord(userId: string): void {
  if (typeof window === 'undefined') return;
  safeStorageOp(() => localStorage.removeItem(storageKey(userId)), undefined);
}

export function isSessionPromptDismissed(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  return (
    safeStorageOp(
      () => sessionStorage.getItem(sessionDismissKey(userId)) === '1',
      false,
    ) ?? false
  );
}

export function setSessionPromptDismissed(userId: string): void {
  if (typeof window === 'undefined') return;
  safeStorageOp(
    () => sessionStorage.setItem(sessionDismissKey(userId), '1'),
    undefined,
  );
}

export function clearSessionPromptDismissed(userId: string): void {
  if (typeof window === 'undefined') return;
  safeStorageOp(
    () => sessionStorage.removeItem(sessionDismissKey(userId)),
    undefined,
  );
}

function isSnoozeActive(record: NotificationPromptRecord): boolean {
  if (record.decision !== 'snoozed' || !record.snoozedUntil) return false;
  return new Date(record.snoozedUntil).getTime() > Date.now();
}

export function resolveNotificationPromptBanner(params: {
  permission: NotificationPermission | 'unsupported';
  pushEnabled: boolean;
  subscribedOnThisDevice: boolean;
  record: NotificationPromptRecord;
  sessionDismissed: boolean;
}): NotificationPromptBannerVariant {
  const {
    permission,
    pushEnabled,
    subscribedOnThisDevice,
    record,
    sessionDismissed,
  } = params;

  if (permission === 'unsupported' || !pushEnabled) {
    return 'none';
  }

  if (sessionDismissed || record.decision === 'opted_out') {
    return 'none';
  }

  if (isSnoozeActive(record)) {
    return 'none';
  }

  if (subscribedOnThisDevice) {
    return 'none';
  }

  if (permission === 'denied') {
    return 'blocked';
  }

  if (permission === 'default') {
    return 'full';
  }

  if (permission === 'granted') {
    return 'account';
  }

  return 'none';
}
