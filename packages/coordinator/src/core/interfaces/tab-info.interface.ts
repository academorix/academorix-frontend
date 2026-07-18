/**
 * @file tab-info.interface.ts
 * @module @stackra/coordinator/core/interfaces
 * @description Interface for tab awareness tracking.
 */

/**
 * Information about a known tab in the coordinator census.
 */
export interface ITabInfo {
  /** Unique tab identifier. */
  readonly id: string;
  /** Whether this tab is the current leader. */
  readonly isLeader: boolean;
  /** Timestamp (ms) when this tab was last seen. */
  readonly lastSeen: number;
  /** Whether this tab is the current instance (self). */
  readonly isSelf: boolean;
}
