/**
 * @file use-route-query-state.hook.ts
 * @module @stackra/routing/react/hooks/use-route-query-state
 * @description Bidirectional binding between a query-param and React
 *   state per PLAN v3.11.7.
 *
 *   F.2 ships the plain URL-binding form only — the `@stackra/query`
 *   integration lands when that package is promoted.
 *
 * TODO(query): swap the internal implementation to `@stackra/query`'s
 *   cache when the package is available. The public surface stays
 *   identical.
 */

import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

/**
 * Options accepted by `useRouteQueryState`.
 */
export interface IRouteQueryStateOptions<T> {
  /** Serialiser — how the value becomes a URL string. */
  readonly serialize?: (value: T) => string;

  /** Deserialiser — how the URL string becomes the value. */
  readonly deserialize?: (raw: string) => T;

  /**
   * Whether writes push new history entries or replace the current
   * one.
   *
   * @default 'replace'
   */
  readonly mode?: "push" | "replace";

  /**
   * Debounce writes to the URL by N ms. F.2 respects the value at
   * the read side (the URL is truth) but does not implement the
   * debounce on writes; the option is preserved for a future
   * integration with `@stackra/query`.
   *
   * @default 0
   */
  readonly debounceMs?: number;
}

/**
 * Bidirectional binding between a URL query-param and React state.
 *
 * @typeParam T - Value type.
 * @param key          - Query-param name.
 * @param defaultValue - Value used when the param is missing.
 * @param options      - Serialisation + navigation-mode options.
 * @returns `[value, setValue]` tuple.
 *
 * @example
 * ```typescript
 * const [tab, setTab] = useRouteQueryState('tab', 'overview');
 * ```
 */
export function useRouteQueryState<T>(
  key: string,
  defaultValue: T,
  options?: IRouteQueryStateOptions<T>,
): readonly [T, (next: T) => void] {
  const [params, setParams] = useSearchParams();

  const serialize = options?.serialize ?? ((value) => String(value));
  const deserialize = options?.deserialize ?? ((raw: string) => raw as unknown as T);
  const mode = options?.mode ?? "replace";

  // Read the current param — fall back to the default.
  const value = useMemo(() => {
    const raw = params.get(key);
    if (raw === null || raw.length === 0) return defaultValue;
    return deserialize(raw);
  }, [params, key, defaultValue, deserialize]);

  const setValue = useCallback(
    (next: T) => {
      const nextParams = new URLSearchParams(params);
      const raw = serialize(next);
      if (raw.length === 0) {
        // Empty string → remove the param entirely so URLs stay clean.
        nextParams.delete(key);
      } else {
        nextParams.set(key, raw);
      }
      // `useSearchParams`'s setter accepts a `NavigateOptions` object
      // — `replace` controls whether we push or replace history.
      setParams(nextParams, { replace: mode === "replace" });
    },
    [params, setParams, key, serialize, mode],
  );

  return [value, setValue] as const;
}
