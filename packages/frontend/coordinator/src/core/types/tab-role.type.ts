/**
 * @file tab-role.type.ts
 * @module @stackra/coordinator/core/types
 * @description Type alias for the role of a tab in the coordinator election.
 */

import { TabRoleEnum } from "@/core/enums";

/**
 * The role of a tab — either 'leader' or 'follower'.
 * Derived from TabRoleEnum for string literal convenience.
 */
export type TabRole = `${TabRoleEnum}`;
