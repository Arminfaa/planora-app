'use client';

import { useSyncExternalStore } from 'react';

function subscribe(query: string, onStoreChange: () => void) {
  const mediaQueryList = window.matchMedia(query);
  mediaQueryList.addEventListener('change', onStoreChange);
  return () => mediaQueryList.removeEventListener('change', onStoreChange);
}

function getSnapshot(query: string) {
  return window.matchMedia(query).matches;
}

function getServerSnapshot() {
  return false;
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribe(query, onStoreChange),
    () => getSnapshot(query),
    getServerSnapshot,
  );
}
