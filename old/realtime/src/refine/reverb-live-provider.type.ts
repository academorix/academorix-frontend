/**
 * @file reverb-live-provider.type.ts
 * @module @academorix/realtime/refine/reverb-live-provider.type
 *
 * @description
 * Structural type mirroring Refine's `LiveProvider` interface so this
 * package doesn't need `@refinedev/core` as a dependency.
 *
 * Refine v5's `LiveProvider` shape:
 *
 * ```ts
 * export interface LiveProvider {
 *   subscribe: (options: {
 *     channel: string;
 *     types: LiveEvent["type"][];
 *     params?: Record<string, unknown>;
 *     callback: (event: LiveEvent) => void;
 *   }) => unknown;
 *   unsubscribe: (subscription: unknown) => void;
 *   publish?: (event: LiveEvent) => void;
 * }
 *
 * export interface LiveEvent {
 *   channel: string;
 *   type: "created" | "updated" | "deleted" | "*";
 *   payload: Record<string, unknown>;
 *   date: Date;
 * }
 * ```
 *
 * We restate the shape here so downstream typechecks don't require
 * the dashboard's Refine version to be pinned into this package.
 */

/** Live-event types Refine understands. */
export type LiveEventType = "created" | "updated" | "deleted" | "*";

/** Payload delivered to Refine subscribers. */
export interface LiveEvent {
  readonly channel: string;
  readonly type: LiveEventType;
  readonly payload: Record<string, unknown>;
  readonly date: Date;
}

/** Argument passed to `LiveProvider.subscribe`. */
export interface LiveSubscribeArgs {
  readonly channel: string;
  readonly types: readonly LiveEventType[];
  readonly params?: Record<string, unknown>;
  readonly callback: (event: LiveEvent) => void;
}

/**
 * Structural shape of Refine's `LiveProvider`. Kept intentionally
 * loose (`unknown` for the subscription handle) so this package
 * doesn't lock a specific `@refinedev/core` major version.
 */
export interface RefineLiveProvider {
  subscribe: (args: LiveSubscribeArgs) => unknown;
  unsubscribe: (subscription: unknown) => void;
  publish?: (event: LiveEvent) => void;
}
