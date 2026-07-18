/**
 * @file use-can-go-back.hook.ts
 * @module @stackra/routing/react/hooks/use-can-go-back
 * @description Return whether the browser can go back in history.
 *
 *   The router state does not expose the raw history stack, so we
 *   read `window.history.length` — the browser reliably tracks the
 *   number of entries including the current one. `>= 2` means at
 *   least one entry precedes the current one.
 *
 *   In non-browser environments (SSR-adjacent, tests without jsdom)
 *   `window` is `undefined` — the hook returns `false` so consumers
 *   don't attempt to navigate back.
 */

/**
 * Whether the browser can go back in history.
 *
 * @returns `true` when a prior history entry exists.
 *
 * @example
 * ```typescript
 * if (useCanGoBack()) navigate(-1);
 * ```
 */
export function useCanGoBack(): boolean {
  // Fail-soft when running outside a browser — the check is safe
  // to call from anywhere.
  if (typeof window === "undefined") return false;
  // `window.history.length` includes the current entry; anything > 1
  // means there is at least one prior entry.
  return window.history.length > 1;
}
