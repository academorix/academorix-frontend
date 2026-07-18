/**
 * @file query-config.interface.ts
 * @module @stackra/contracts/interfaces/state
 * @description Configuration contract for a store-backed query — fetches
 *   data and populates a DI-managed store.
 *
 *   Lives in contracts so consumers type their query configs against a
 *   single source of truth, independent of the `@stackra/state` runtime.
 *
 *   `liveMode` fields wire the query to a realtime channel via
 *   `@stackra/realtime` (`REALTIME_MANAGER`) so incoming events either
 *   trigger a background refetch (`'auto'`) or fire the caller's
 *   `onLiveEvent` callback (`'manual'`).
 */

import type { ILiveEvent, LiveEventType } from "../query/live-event.interface";

/**
 * How `useQuery` reacts to a realtime event on its subscribed
 * channel.
 *
 * - **`'off'`** — no subscription is opened.
 * - **`'auto'`** — subscribe → on receive, run the query's fetcher
 *   again (background refetch). Best UX for lists that need to stay
 *   fresh across clients.
 * - **`'manual'`** — subscribe → fire `onLiveEvent`; the caller
 *   decides whether to invalidate. Useful for high-frequency channels
 *   where you want to batch or throttle.
 */
export type QueryLiveMode = "off" | "auto" | "manual";

/**
 * Configuration for a store-backed query.
 *
 * @typeParam S - The store state shape the query populates.
 * @typeParam TData - The raw data type returned by the fetcher (defaults to `S`).
 */
export interface IQueryConfig<S, TData = S> {
  /** Unique cache key for deduplication and refetch identity. */
  queryKey: readonly unknown[];

  /** Async function that fetches the raw data. */
  fetcher: () => Promise<TData>;

  /** Optional transform from raw data to store state. */
  select?: (data: TData) => S;

  /** Whether the query should run. @default true */
  enabled?: boolean;

  /** Milliseconds the fetched data stays fresh before a refetch is allowed. @default 0 */
  staleTime?: number;

  /** Polling interval in milliseconds. `0` disables polling. @default 0 */
  refetchInterval?: number;

  /** Refetch when the window regains focus. @default false */
  refetchOnWindowFocus?: boolean;

  // ────────────────────────────────────────────────────────────────
  // Live mode (realtime invalidation)
  // ────────────────────────────────────────────────────────────────

  /**
   * How to react to incoming realtime events on `liveChannel`.
   *
   * When omitted, falls back to `QueryModule.forRoot`'s
   * `defaultLiveMode`. When that is also unset, defaults to
   * `'off'`.
   */
  liveMode?: QueryLiveMode;

  /**
   * Channel name to subscribe on. Required when `liveMode` is
   * `'auto'` or `'manual'`. Convention: resource-scoped
   * (`'themes'`, `'presets'`, `'settings.appearance'`).
   */
  liveChannel?: string;

  /**
   * Event types to listen for. `['*']` matches every type.
   * @default `['*']`
   */
  liveTypes?: readonly LiveEventType[];

  /**
   * Named realtime connection from `REALTIME_MANAGER`. Defaults to
   * the connection manager's own default.
   */
  liveConnection?: string;

  /**
   * Whether to use a private channel (`connection.privateChannel(name)`)
   * instead of a public one. @default false
   */
  livePrivate?: boolean;

  /**
   * Callback fired on every received event, regardless of
   * `liveMode`. In `'auto'` mode the invalidation still runs; the
   * callback is a side-observer. In `'manual'` mode the callback
   * is the ONLY reaction.
   */
  onLiveEvent?: (event: ILiveEvent) => void;
}
