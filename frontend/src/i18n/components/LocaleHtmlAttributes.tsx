'use client';

import { useEffect } from 'react';
import { applyDocumentLocale, resolveInitialLocale } from '../utils';

export function LocaleHtmlAttributes() {
  useEffect(() => {
    applyDocumentLocale(resolveInitialLocale());
  }, []);

  return null;
}
