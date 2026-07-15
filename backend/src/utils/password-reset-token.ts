import { createHash, randomBytes } from 'crypto';

/** Hex-only tokens survive email clients better than base64url query values. */
export function generatePasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256')
    .update(normalizePasswordResetToken(token))
    .digest('hex');
}

export function normalizePasswordResetToken(token: string): string {
  let value = token.trim();

  // Defensive: some clients leave encoded fragments in the path/query.
  if (value.includes('%')) {
    try {
      value = decodeURIComponent(value);
    } catch {
      // keep original
    }
  }

  // Soft line-breaks / zero-width chars from email clients.
  value = value.replace(/[\s\u200B-\u200D\uFEFF]/g, '');

  if (/^[a-fA-F0-9]+$/.test(value)) {
    return value.toLowerCase();
  }

  return value;
}
