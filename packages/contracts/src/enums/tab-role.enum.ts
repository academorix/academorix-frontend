/**
 * @file tab-role.enum.ts
 * @module @stackra/contracts/enums
 * @description Role of a browser tab in a leader-election coordination
 *   group.
 */

/**
 * Role of a tab in a leader-election group.
 */
export enum TabRole {
  /** The tab currently holds leadership and owns exclusive work. */
  Leader = "leader",
  /** The tab is following an elected leader. */
  Follower = "follower",
  /** No leader exists yet; the tab is participating in an election. */
  Candidate = "candidate",
}
