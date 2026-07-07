import type { Locale } from '../types';
import { enMessages, type Messages } from './en';
import { faMessages } from './fa';

export const messages: Record<Locale, Messages> = {
  en: enMessages,
  fa: faMessages,
};

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? messages.en;
}

export { enMessages, faMessages };
export type { Messages };
