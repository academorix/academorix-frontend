/**
 * @file tab-info.interface.ts
 * @module @stackra/contracts/interfaces/coordinator
 * @description Snapshot of a single tab in the coordination group.
 */

/**
 * Snapshot of a single tab known to the tab coordinator.
 */
export interface ITabInfo {
  /** Unique tab identifier assigned by the coordinator. */
  id: string;

  /** Whether this tab is the current leader. */
  isLeader: boolean;

  /** The most recent heartbeat timestamp (ms since epoch). */
  lastSeen: number;

  /** Whether this tab is the local (self) tab. */
  isSelf: boolean;
}
