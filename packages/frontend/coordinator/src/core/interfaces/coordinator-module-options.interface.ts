/**
 * @file coordinator-module-options.interface.ts
 * @module @stackra/coordinator/core/interfaces
 * @description Configuration for CoordinatorModule.forRoot().
 */

/**
 * Configuration options for the coordinator module.
 *
 * @example
 * ```typescript
 * CoordinatorModule.forRoot({
 *   channelName: 'my-pos-app',
 *   heartbeatMs: 1000,
 *   staleThresholdMs: 3000,
 *   broadcastPatterns: ['sync:**', 'auth:**'],
 * });
 * ```
 */
export interface ICoordinatorModuleOptions {
  /** BroadcastChannel name shared across tabs. @default 'stackra-coordinator' */
  channelName?: string;
  /** Leader heartbeat interval in ms. @default 1000 */
  heartbeatMs?: number;
  /** Time (ms) after which a leader is considered stale. @default 3000 */
  staleThresholdMs?: number;
  /** Enable cross-tab event relay. @default true */
  broadcastEvents?: boolean;
  /** Event patterns to relay across tabs. @default ['sync:**', 'auth:**', 'state:**'] */
  broadcastPatterns?: string[];
  /** Use Web Locks API for distributed locks. @default true */
  preferWebLocks?: boolean;
  /** Use Web Locks API for leader election. @default true */
  preferWebLocksElection?: boolean;
  /** Transfer leadership to visible/focused tab. @default false */
  preferVisibleLeader?: boolean;
}
