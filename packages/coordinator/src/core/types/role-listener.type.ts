/**
 * @file role-listener.type.ts
 * @module @stackra/coordinator/core/types
 * @description Callback type for role change notifications.
 */

import type { TabRole } from './tab-role.type';

/**
 * Listener callback invoked when the tab's role changes.
 *
 * @param role - The new role ('leader' or 'follower')
 */
export type RoleListener = (role: TabRole) => void;
