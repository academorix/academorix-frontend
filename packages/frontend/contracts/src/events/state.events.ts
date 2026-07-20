/**
 * @file state.events.ts
 * @module @stackra/contracts/events
 * @description Event-name suffixes emitted by `@stackra/state` on the
 *   `EVENT_EMITTER` bus.
 *
 *   Every store change/query/mutation is emitted as `{storeName}.{suffix}`
 *   (e.g. `theme.changed`, `i18n.query.success`). The suffixes live in
 *   contracts so cross-package consumers (devtools, sync, dashboards) can
 *   subscribe without depending on the `@stackra/state` runtime.
 */

/**
 * Store lifecycle event-name suffixes.
 *
 * Emitted as `{storeName}.{suffix}` — e.g. a store named `theme`
 * emits `theme.changed`, `theme.query.success`, `theme.mutate.failed`.
 */
export const STATE_EVENTS = {
  /** A store's state changed (any `setState`). Payload: `{ name, state, changed, previous }`. */
  CHANGED: "changed",
  /** A store was hydrated from persisted storage. Payload: `{ state }`. */
  HYDRATED: "hydrated",
  /** A cross-tab sync update was applied to the store. Payload: `{ state, timestamp }`. */
  SYNC_RECEIVED: "sync.received",
  /** A realtime (WebSocket) update was applied to the store. Payload: `{ state, timestamp }`. */
  REALTIME_RECEIVED: "realtime.received",
  /** A store-backed query started fetching. Payload: `{ queryKey, isInitial }`. */
  QUERY_STARTED: "query.started",
  /** A store-backed query succeeded. Payload: `{ queryKey, state }`. */
  QUERY_SUCCESS: "query.success",
  /** A store-backed query failed. Payload: `{ queryKey, error }`. */
  QUERY_FAILED: "query.failed",
  /** An optimistic mutation started. Payload: `{ mutationId, state, previous }`. */
  MUTATE_STARTED: "mutate.started",
  /** An optimistic mutation succeeded. Payload: `{ mutationId, state }`. */
  MUTATE_SUCCESS: "mutate.success",
  /** An optimistic mutation failed and rolled back. Payload: `{ mutationId, error, rolledBackTo, attempted }`. */
  MUTATE_FAILED: "mutate.failed",
} as const;

/** Union type of every store event-name suffix. */
export type StateEventName = (typeof STATE_EVENTS)[keyof typeof STATE_EVENTS];
