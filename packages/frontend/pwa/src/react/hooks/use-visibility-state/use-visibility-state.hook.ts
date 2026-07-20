/**
 * @file use-visibility-state.hook.ts
 * @module @stackra/pwa/react/hooks
 * @description Subscribe to `document.visibilityState`.
 */

import { useEffect, useState } from 'react';

/**
 * Read the current page visibility state.
 *
 * Fires re-renders on `visibilitychange`. Returns `'visible'` on SSR
 * so consumers can safely gate work on the initial value.
 *
 * @example
 * ```tsx
 * import { useVisibilityState } from '@stackra/pwa/react';
 *
 * function PausableTimer() {
 *   const state = useVisibilityState();
 *   useEffect(() => {
 *     if (state === 'hidden') pauseTimer();
 *     else resumeTimer();
 *   }, [state]);
 * }
 * ```
 */
export function useVisibilityState(): DocumentVisibilityState {
  const [state, setState] = useState<DocumentVisibilityState>(() =>
    typeof document !== 'undefined' ? document.visibilityState : 'visible'
  );

  useEffect(() => {
    // SSR guard — no document, no listener.
    if (typeof document === 'undefined') return;
    const onChange = (): void => setState(document.visibilityState);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return state;
}
