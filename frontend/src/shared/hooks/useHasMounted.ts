'use client';

import { useSyncExternalStore } from 'react';

function subscribe() {
  return () => {};
}

export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
