/**
 * @file tab-role.enum.ts
 * @module @stackra/coordinator/core/enums
 * @description Enum for the role of a tab in the coordinator election.
 */

/**
 * The role of a tab in the leader election.
 */
export enum TabRoleEnum {
  /** This tab is the elected leader — performs expensive single-instance operations. */
  LEADER = "leader",
  /** This tab is a follower — receives relayed data from the leader. */
  FOLLOWER = "follower",
}
