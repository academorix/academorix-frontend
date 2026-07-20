/**
 * @file use-page-visibility.hook.ts
 * @module @stackra/pwa/react/hooks
 * @description Callback-driven page-visibility hook.
 *
 *   For components that don't need a re-render on every transition —
 *   just a side effect — `usePageVisibility(cb)` invokes the callback
 *   with the new state.
 */

import { useEffect } from "react";

/** Callback invoked on each `visibilitychange`. */
export type PageVisibilityCallback = (state: DocumentVisibilityState) => void;

/**
 * Invoke `callback` on every `visibilitychange` event.
 *
 * @example
 * ```tsx
 * import { usePageVisibility } from '@stackra/pwa/react';
 *
 * function AnalyticsFlusher() {
 *   usePageVisibility((state) => {
 *     if (state === 'hidden') analytics.flush();
 *   });
 *   return null;
 * }
 * ```
 */
export function usePageVisibility(callback: PageVisibilityCallback): void {
  useEffect(() => {
    // SSR guard.
    if (typeof document === "undefined") return;
    const onChange = (): void => callback(document.visibilityState);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, [callback]);
}
