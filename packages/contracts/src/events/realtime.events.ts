/**
 * @file realtime.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by `@stackra/realtime` on the
 *   `EVENT_EMITTER` bus.
 *
 *   Constants live in contracts so cross-package consumers (dashboards,
 *   audit logs, error trackers) can subscribe without depending on the
 *   realtime package directly.
 *
 *   @example
 *   ```typescript
 *   import { REALTIME_EVENTS } from '@stackra/contracts';
 *
 *   @OnEvent(REALTIME_EVENTS.DISCONNECTED)
 *   onDisconnect(payload: { connection: string; reason: string }) {
 *     metrics.increment('realtime.disconnect', payload);
 *   }
 *   ```
 */

/**
 * Realtime lifecycle event names.
 *
 * Payload shapes:
 * - `CONNECTED`    — `{ connection }`
 * - `DISCONNECTED` — `{ connection, reason }`
 * - `RECONNECTING` — `{ connection, attempt }`
 * - `ERROR`        — `{ connection, error }`
 * - `MESSAGE`      — `{ connection, channel, event, data }`
 */
export const REALTIME_EVENTS = {
  /** A named connection successfully attached. */
  CONNECTED: "realtime.connected",
  /** A named connection was closed. */
  DISCONNECTED: "realtime.disconnected",
  /** A driver is attempting to reconnect after a drop. */
  RECONNECTING: "realtime.reconnecting",
  /** A transport-level error was surfaced by a driver. */
  ERROR: "realtime.error",
  /** A message frame was received on a subscribed channel. */
  MESSAGE: "realtime.message",
} as const;

/**
 * Union type of every emitted realtime event name.
 */
export type RealtimeEventName = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];
