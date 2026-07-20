/**
 * @file use-query.hook.ts
 * @module @stackra/query/react/hooks/use-query
 * @description React query hook — thin wrapper over
 *   `@tanstack/react-query`'s `useQuery`.
 *
 *   Adds three Stackra-specific layers on top:
 *
 *   1. **Optional state-store write.** When called with a store
 *      token as the first arg, writes the query result into that
 *      `@stackra/state` store on success (backward-compat with
 *      theming/settings/sdui, which expose their reactive data via
 *      state stores for non-hook consumers).
 *   2. **`liveMode`.** Composes `useLiveSubscription` to invalidate
 *      the query on realtime events (`'auto'`) or hand the event to
 *      a caller callback (`'manual'`). Realtime is optional.
 *   3. **Module defaults.** Pulls `staleTime` / `refetchInterval` /
 *      `refetchOnWindowFocus` / `liveMode` defaults from
 *      `QUERY_CONFIG` when the per-call value is omitted.
 *
 *   The underlying cache, retry, dedup, stale-time, gc, and devtools
 *   all come from TanStack Query.
 */

import { useEffect, useMemo } from "react";
import { useInject, useOptionalInject } from "@stackra/container/react";
import type { Store } from "@tanstack/store";
import { useQuery as useTanstackQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/query-core";
import { EVENT_EMITTER, STATE_EVENTS } from "@stackra/contracts";
import type { IEventEmitter, ILiveEvent, IQueryConfig, QueryLiveMode } from "@stackra/contracts";
import { StateRegistry } from "@stackra/state";
import { QUERY_CONFIG } from "@/core/tokens/query.tokens";
import type { QueryModuleOptions } from "@/core/interfaces/query-module-options.interface";
import { useLiveSubscription } from "../use-live-subscription";

/**
 * Return type of `useQuery()`.
 *
 * @typeParam S - The state shape returned by the hook (either the
 *   raw data or the `select`ed shape).
 */
export interface UseQueryReturn<S> {
  /** The current data — `undefined` before the first successful fetch. */
  data: S | undefined;
  /** Whether the initial fetch is in progress. */
  isLoading: boolean;
  /** Whether a background refetch is in progress. */
  isFetching: boolean;
  /** The last error from a failed fetch (`null` if none). */
  error: Error | null;
  /** Manually trigger a refetch. */
  refetch: () => Promise<void>;
  /** Whether the data has been fetched at least once. */
  isSuccess: boolean;
}

/**
 * Fetch data via TanStack Query, optionally writing the result into
 * a `@stackra/state` store on success.
 *
 * Two call signatures:
 *
 * ```typescript
 * // With store token — writes result into store on success.
 * useQuery(THEMES_STORE, { queryKey, fetcher, staleTime, ... });
 *
 * // Without store token — pure TanStack Query pattern.
 * useQuery({ queryKey, fetcher, staleTime, ... });
 * ```
 *
 * @example Basic query
 * ```typescript
 * const { data, isLoading } = useQuery(THEMES_STORE, {
 *   queryKey: ['themes'],
 *   fetcher: () => api.listThemes(),
 *   staleTime: 5 * 60 * 1000,
 * });
 * ```
 *
 * @example Auto-invalidated by a realtime channel
 * ```typescript
 * useQuery(THEMES_STORE, {
 *   queryKey: ['themes'],
 *   fetcher: () => api.listThemes(),
 *   liveMode: 'auto',
 *   liveChannel: 'themes',
 * });
 * ```
 */
export function useQuery<S, TData = S>(
  token: symbol,
  config: IQueryConfig<S, TData>,
): UseQueryReturn<S>;
export function useQuery<S, TData = S>(config: IQueryConfig<S, TData>): UseQueryReturn<S>;
export function useQuery<S, TData = S>(
  tokenOrConfig: symbol | IQueryConfig<S, TData>,
  maybeConfig?: IQueryConfig<S, TData>,
): UseQueryReturn<S> {
  // ── Normalise call signature ─────────────────────────────────────
  const hasToken = typeof tokenOrConfig === "symbol";
  const token: symbol | undefined = hasToken ? tokenOrConfig : undefined;
  const config: IQueryConfig<S, TData> = hasToken
    ? (maybeConfig as IQueryConfig<S, TData>)
    : (tokenOrConfig as IQueryConfig<S, TData>);

  // ── Inject dependencies ──────────────────────────────────────────
  const store = hasToken ? useInject<Store<S>>(token as symbol) : null;
  const events = useOptionalInject<IEventEmitter>(EVENT_EMITTER);
  const registry = useOptionalInject<StateRegistry>(StateRegistry);
  const defaults = useOptionalInject<Required<QueryModuleOptions>>(QUERY_CONFIG);
  const tanstackClient: QueryClient = useQueryClient();

  const staleTime = config.staleTime ?? defaults?.defaultStaleTime ?? 0;
  const refetchInterval = config.refetchInterval ?? defaults?.defaultRefetchInterval ?? 0;
  const refetchOnWindowFocus =
    config.refetchOnWindowFocus ?? defaults?.refetchOnWindowFocus ?? false;
  const liveMode: QueryLiveMode = config.liveMode ?? defaults?.defaultLiveMode ?? "off";

  // ── Store name for event prefixing (only when there's a store) ───
  const storeName = useMemo(
    () => (token ? (registry?.getNameByToken(token) ?? "unknown") : "query"),
    [registry, token],
  );

  // ── TanStack Query hook ──────────────────────────────────────────
  const result = useTanstackQuery<TData, Error>({
    queryKey: [...config.queryKey],
    queryFn: async () => {
      events?.emit(`${storeName}.${STATE_EVENTS.QUERY_STARTED}`, {
        queryKey: config.queryKey,
      });
      try {
        const data = await config.fetcher();
        events?.emit(`${storeName}.${STATE_EVENTS.QUERY_SUCCESS}`, {
          queryKey: config.queryKey,
        });
        return data;
      } catch (error: unknown) {
        events?.emit(`${storeName}.${STATE_EVENTS.QUERY_FAILED}`, {
          queryKey: config.queryKey,
          error,
        });
        throw error;
      }
    },
    enabled: config.enabled ?? true,
    staleTime,
    refetchInterval: refetchInterval > 0 ? refetchInterval : false,
    refetchOnWindowFocus,
  });

  // ── Apply select + write to store on data change ─────────────────
  useEffect(() => {
    if (result.data === undefined) return;
    if (!store) return;
    const next = config.select ? config.select(result.data) : (result.data as unknown as S);
    store.setState(() => next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.data, store]);

  // ── Live-mode: subscribe to realtime channel + invalidate ────────
  useLiveSubscription({
    enabled: liveMode !== "off" && (config.enabled ?? true),
    ...(config.liveChannel !== undefined ? { channel: config.liveChannel } : {}),
    ...(config.liveTypes !== undefined ? { types: config.liveTypes } : {}),
    ...(config.liveConnection !== undefined ? { connection: config.liveConnection } : {}),
    ...(config.livePrivate !== undefined ? { private: config.livePrivate } : {}),
    onEvent: (event: ILiveEvent) => {
      try {
        config.onLiveEvent?.(event);
      } catch {
        // fail-soft — a broken observer must not stop invalidation.
      }
      if (liveMode === "auto") {
        void tanstackClient.invalidateQueries({ queryKey: [...config.queryKey] });
      }
    },
  });

  // ── Derive the returned data shape ───────────────────────────────
  // When there's a store, callers expect `data` to be the store
  // shape; when there's no store, they get the raw TanStack result
  // (optionally passed through `select`).
  const data: S | undefined =
    result.data === undefined
      ? undefined
      : config.select
        ? config.select(result.data)
        : (result.data as unknown as S);

  return {
    data,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: async () => {
      await result.refetch();
    },
  };
}
