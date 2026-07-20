/**
 * @file tab-coordinator.interface.ts
 * @module @stackra/contracts/interfaces/coordinator
 * @description Public contract for the browser-tab coordinator service.
 *
 *   Elects one leader across a group of open tabs (via `BroadcastChannel`
 *   or `localStorage`) and gives consumers a way to observe role changes,
 *   enumerate active tabs, and resign leadership.
 */

import type { TabRole } from "@/enums/tab-role.enum";
import type { ITabInfo } from "./tab-info.interface";

/**
 * Listener callback fired when the local tab's role changes.
 */
export type TabRoleListener = (role: TabRole, previous: TabRole | null) => void;

/**
 * Contract for the tab coordinator — bundles leader election, tab census,
 * and role-change subscriptions behind one small surface so consumers can
 * inject it as an optional peer without depending on the concrete class.
 */
export interface ITabCoordinator {
  /** Whether the local tab currently holds leadership. */
  isLeader(): boolean;

  /** The local tab's unique id. */
  getTabId(): string;

  /** The current leader's tab id, or `null` when no leader is elected. */
  getLeaderId(): string | null;

  /** The local tab's current role. */
  getRole(): TabRole;

  /** Enumerate every active tab currently known to the coordinator. */
  getActiveTabs(): ITabInfo[];

  /** Total number of active tabs. */
  getTabCount(): number;

  /**
   * Subscribe to role changes on the local tab.
   *
   * @param listener - Callback fired every time the local role changes.
   * @returns Unsubscribe function.
   */
  onRoleChange(listener: TabRoleListener): () => void;

  /** Resign leadership if the local tab is the leader (no-op otherwise). */
  resign(): void;

  /** Release every resource and stop responding to the coordination group. */
  destroy(): void;
}
