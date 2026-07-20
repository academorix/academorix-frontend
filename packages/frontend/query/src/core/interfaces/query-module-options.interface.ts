/**
 * @file query-module-options.interface.ts
 * @module @stackra/query/core/interfaces
 * @description Options accepted by `QueryModule.forRoot()`.
 *
 *   These are query-layer defaults applied by `useQuery` /
 *   `useMutation` when a per-call config omits the corresponding
 *   field. Package-owned (the module's own option shape, not a
 *   cross-package contract).
 */

import type { MutationMode, QueryLiveMode } from "@stackra/contracts";

/**
 * Default configuration for the query layer.
 */
export interface QueryModuleOptions {
  /** Default staleness window in milliseconds. @default 0 */
  defaultStaleTime?: number;

  /** Default polling interval in milliseconds. `0` disables polling. @default 0 */
  defaultRefetchInterval?: number;

  /** Whether queries refetch on window focus by default. @default false */
  refetchOnWindowFocus?: boolean;

  // ────────────────────────────────────────────────────────────────
  // Mutation-mode defaults
  // ────────────────────────────────────────────────────────────────

  /**
   * Default execution mode applied by `useMutation` when the call
   * site omits `mutationMode`.
   * @default `'pessimistic'`
   */
  defaultMutationMode?: MutationMode;

  /**
   * Countdown (ms) between an `'undoable'` mutation being queued and
   * it firing. The user has this long to cancel via the toast UI.
   * @default 5000
   */
  undoableTimeout?: number;

  // ────────────────────────────────────────────────────────────────
  // Live-mode defaults
  // ────────────────────────────────────────────────────────────────

  /**
   * Default reaction mode when a live event lands on a query's
   * subscribed channel. `useQuery` inherits it when its own
   * `liveMode` is omitted.
   * @default `'off'`
   */
  defaultLiveMode?: QueryLiveMode;
}
