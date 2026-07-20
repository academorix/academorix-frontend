/**
 * @file network.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by `@stackra/network` on the
 *   `EVENT_EMITTER` bus.
 *
 *   Constants live in contracts so cross-package consumers (sync, offline
 *   queues, dashboards) can subscribe without depending on the network
 *   runtime.
 */

/** Event name for a network status change. Payload: `{ status: INetworkStatus }`. */
export const NETWORK_STATUS_CHANGED = "network.status-changed";

/**
 * Network lifecycle event names.
 */
export const NETWORK_EVENTS = {
  /** The network status changed (online/offline/type/speed). */
  STATUS_CHANGED: NETWORK_STATUS_CHANGED,
} as const;

/** Union type of every emitted network event name. */
export type NetworkEventName = (typeof NETWORK_EVENTS)[keyof typeof NETWORK_EVENTS];
