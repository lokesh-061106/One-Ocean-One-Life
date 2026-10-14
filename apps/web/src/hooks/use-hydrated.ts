'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * True after the document has been hydrated on the client, false during SSR
 * and for the hydration render. Replaces `useState(false)` + an effect that
 * flips it to `true`, which React warns about (state updates must not be
 * scheduled synchronously inside an effect).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
