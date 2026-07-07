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
import { useAuth } from '@/features/auth/hooks/useAuth';
import { api } from '@/lib/api';
import { getMessages } from './messages';
import { DEFAULT_LOCALE, getLocaleDirection, type Locale } from './types';
import {
  applyDocumentLocale,
  createTranslator,
  readLocaleCookie,
  resolveInitialLocale,
  writeLocaleCookie,
  type Translator,
} from './utils';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translator;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

async function syncPreferredLocale(locale: Locale): Promise<void> {
  try {
    await api.patch('/notifications/preferences', { preferredLocale: locale });
  } catch {
    // Locale preference sync is best-effort; cookie remains the source of truth.
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const initial = resolveInitialLocale();
    setLocaleState(initial);
    applyDocumentLocale(initial);
    setIsHydrated(true);
  }, []);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      setLocaleState(nextLocale);
      writeLocaleCookie(nextLocale);
      applyDocumentLocale(nextLocale);

      if (isAuthenticated) {
        void syncPreferredLocale(nextLocale);
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) {
      return;
    }

    const cookieLocale = readLocaleCookie();
    if (cookieLocale) {
      void syncPreferredLocale(cookieLocale);
    }
  }, [isAuthenticated, isHydrated]);

  const dir = getLocaleDirection(locale);
  const isRtl = dir === 'rtl';
  const messages = getMessages(locale);
  const t = useMemo(
    () => createTranslator(locale, messages),
    [locale, messages],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      dir,
      isRtl,
    }),
    [dir, isRtl, locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }

  return context;
}
