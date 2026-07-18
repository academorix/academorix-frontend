/**
 * @file coordinator.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by `@stackra/coordinator` on the
 *   `EVENT_EMITTER` bus.
 *
 *   The constants live in contracts because cross-package consumers
 *   (failover orchestrators, telemetry collectors, UI indicators) need
 *   to subscribe to these names without depending on the coordinator
 *   package directly.
 *
 *   @example
 *   ```typescript
 *   import { COORDINATOR_EVENTS } from '@stackra/contracts';
 *
 *   @OnEvent(COORDINATOR_EVENTS.LEADER_ELECTED)
 *   onLeaderElected({ tabId }: { tabId: string }) {
 *     startWebSocketConnection();
 *   }
 *   ```
 */

/**
 * Coordinator lifecycle event names.
 *
 * Payload shapes:
 * - `LEADER_ELECTED`  — `{ tabId }` — this tab became the leader
 * - `LEADER_RESIGNED` — `{ tabId }` — this tab stepped down
 * - `TAB_JOINED`      — `{ tabId }` — a new peer tab appeared
 * - `TAB_LEFT`        — `{ tabId }` — a peer tab went stale / closed
 */
export const COORDINATOR_EVENTS = {
  /** This tab became the elected leader. */
  LEADER_ELECTED: "coordinator.leader-elected",
  /** This tab stepped down from leadership. */
  LEADER_RESIGNED: "coordinator.leader-resigned",
  /** A new peer tab joined the coordinator channel. */
  TAB_JOINED: "coordinator.tab-joined",
  /** A peer tab went stale or closed. */
  TAB_LEFT: "coordinator.tab-left",
} as const;

/**
 * Union type of every emitted coordinator event name. Use it to constrain
 * listener registrations or event payload maps.
 */
export type CoordinatorEventName = (typeof COORDINATOR_EVENTS)[keyof typeof COORDINATOR_EVENTS];
