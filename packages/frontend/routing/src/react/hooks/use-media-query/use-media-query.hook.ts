/**
 * @file use-media-query.hook.ts
 * @module @stackra/routing/react/hooks/use-media-query
 * @description Subscribe to a CSS media query and re-render on change.
 *
 *   Wraps `window.matchMedia` in a `useSyncExternalStore` handshake so
 *   the returned boolean is always consistent with the current DOM
 *   state — no double-render on the first mount, no stale value after
 *   viewport-resize. SSR-safe: the server snapshot returns
 *   `defaultValue` (defaulting to `false`) so the tree renders with a
 *   deterministic non-mobile shape until hydration.
 *
 *   Consumed by `<OverlayOutlet />` to swap the overlay primitive on
 *   mobile viewports (dialog / drawer collapse to `<Sheet>` below the
 *   `md` breakpoint per PLAN §14).
 */

import { useCallback, useSyncExternalStore } from "react";

/**
 * Options accepted by {@link useMediaQuery}.
 */
export interface IUseMediaQueryOptions {
  /**
   * Value returned during server render and initial hydration. Set
   * this to a deterministic guess for the target viewport so the SSR
   * tree matches the first client render.
   *
   * @default false
   */
  readonly defaultValue?: boolean;
}

/**
 * Subscribe to a CSS media query.
 *
 * @param query - Any valid media-query string
 *   (`'(max-width: 767px)'`, `'(prefers-color-scheme: dark)'`, ...).
 * @param options - See {@link IUseMediaQueryOptions}.
 * @returns `true` when the query currently matches. `false` when it
 *   doesn't OR when running server-side.
 *
 * @example
 * ```typescript
 * const isMobile = useMediaQuery('(max-width: 767px)');
 * ```
 */
export function useMediaQuery(query: string, options: IUseMediaQueryOptions = {}): boolean {
  const { defaultValue = false } = options;

  // `subscribe` — attach a listener that fires on media-query state
  // changes. `useSyncExternalStore` handles the teardown for us.
  const subscribe = useCallback(
    (onChange: () => void): (() => void) => {
      // Guard against SSR + old jsdom that lacks `matchMedia`.
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return () => undefined;
      }
      const mql = window.matchMedia(query);
      // Some engines (Safari < 14) only support the legacy
      // `addListener`/`removeListener` pair — fall back when
      // `addEventListener` is missing.
      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
      }
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    },
    [query],
  );

  // `getSnapshot` — return the CURRENT match state. Called during
  // render, must be pure.
  const getSnapshot = useCallback((): boolean => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return defaultValue;
    }
    return window.matchMedia(query).matches;
  }, [query, defaultValue]);

  // `getServerSnapshot` — used during SSR + first paint. Returns the
  // user-provided default so the server + first client render agree.
  const getServerSnapshot = useCallback((): boolean => defaultValue, [defaultValue]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
