/**
 * @file coordinator.config.ts
 * @module @stackra/coordinator/config
 * @description Application-level coordinator configuration.
 *   Consumed by `CoordinatorModule.forRoot()` at bootstrap.
 */

import { defineConfig } from "@stackra/coordinator";

export const coordinatorConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Channel Name
  |--------------------------------------------------------------------------
  |
  | The BroadcastChannel name shared across all browser tabs. All tabs with
  | the same channel name participate in the same leader election and receive
  | the same relayed events. Use different names to isolate applications
  | running on the same origin.
  |
  */
  channelName: "stackra-coordinator",

  /*
  |--------------------------------------------------------------------------
  | Heartbeat Interval
  |--------------------------------------------------------------------------
  |
  | The interval (in milliseconds) at which the leader tab broadcasts
  | heartbeat pings to prove liveness. Shorter intervals mean faster
  | failover when the leader closes, at the cost of more cross-tab traffic.
  |
  */
  heartbeatMs: 1000,

  /*
  |--------------------------------------------------------------------------
  | Stale Threshold
  |--------------------------------------------------------------------------
  |
  | Time (in milliseconds) after which a leader is considered stale if no
  | heartbeat is received. Should be 2-3x the heartbeat interval to allow
  | for scheduling jitter and tab throttling.
  |
  */
  staleThresholdMs: 3000,

  /*
  |--------------------------------------------------------------------------
  | Cross-Tab Event Broadcasting
  |--------------------------------------------------------------------------
  |
  | When enabled, events emitted via @stackra/events that match the
  | configured patterns will be relayed to all other open tabs via
  | BroadcastChannel. This enables features like "logout all tabs" or
  | "sync state across tabs" without server round-trips.
  |
  */
  broadcastEvents: true,

  /*
  |--------------------------------------------------------------------------
  | Broadcast Patterns
  |--------------------------------------------------------------------------
  |
  | Event name patterns to relay across tabs. Uses the same wildcard syntax
  | as the event emitter: * matches one segment, ** matches multiple.
  | Only events matching at least one pattern are broadcast.
  |
  */
  broadcastPatterns: ["sync:**", "auth:**", "state:**"],

  /*
  |--------------------------------------------------------------------------
  | Web Locks Preference
  |--------------------------------------------------------------------------
  |
  | When true, the coordinator uses the Web Locks API for cross-tab mutual
  | exclusion and leader election. Web Locks are race-free and OS-level,
  | providing instant failover when a tab closes. Falls back to localStorage
  | compare-and-swap when unavailable (older browsers).
  |
  */
  preferWebLocks: true,

  /*
  |--------------------------------------------------------------------------
  | Web Locks Election
  |--------------------------------------------------------------------------
  |
  | When true, leader election uses navigator.locks.request() which provides
  | instant failover — the lock is automatically released when a tab closes,
  | and the next waiting tab immediately becomes leader. Falls back to the
  | heartbeat protocol when Web Locks are unavailable.
  |
  */
  preferWebLocksElection: true,

  /*
  |--------------------------------------------------------------------------
  | Prefer Visible Leader
  |--------------------------------------------------------------------------
  |
  | When true, if the current leader becomes hidden (tab minimized or switched
  | away) and another tab becomes visible, leadership will transfer to the
  | visible tab. This ensures the active tab has priority for resource-intensive
  | operations like animations, sync, and DOM updates.
  |
  */
  preferVisibleLeader: false,
});
