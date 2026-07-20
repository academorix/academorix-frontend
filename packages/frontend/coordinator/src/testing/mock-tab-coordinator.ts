/**
 * @file mock-tab-coordinator.ts
 * @module @stackra/coordinator/testing
 * @description In-memory mock of `TabCoordinator`.
 *
 *   No real `BroadcastChannel` or Web Locks — the tab starts as leader
 *   by default and stays there unless a test calls `.simulateRole()`.
 *   Role listeners fire synchronously on role changes, matching the
 *   production behaviour.
 */

import type { ITabInfo } from '@/core/interfaces';
import type { TabRole, RoleListener } from '@/core/types';

/**
 * In-memory tab coordinator for testing.
 *
 * Defaults to a single-tab leader — the tab is the leader from the
 * moment it's constructed. Tests can flip roles with `simulateRole()`
 * to exercise both branches of consumer code.
 */
export class MockTabCoordinator {
  /** Unique tab identifier — synthesised on construction. */
  public readonly tabId: string = `mock-tab-${Math.random().toString(36).slice(2, 10)}`;

  /** Current role — leader by default. */
  private role: TabRole = 'leader';

  /** Leader ID — this tab's ID when leader, else null. */
  private leaderId: string | null = this.tabId;

  /** Registered listeners fired on role changes. */
  private readonly listeners = new Set<RoleListener>();

  /** Whether `destroy()` has been called. */
  private destroyed = false;

  public isLeader(): boolean {
    return this.role === 'leader';
  }

  public getTabId(): string {
    return this.tabId;
  }

  public getLeaderId(): string | null {
    return this.leaderId;
  }

  public getRole(): TabRole {
    return this.role;
  }

  public getActiveTabs(): ITabInfo[] {
    return [{ id: this.tabId, isLeader: this.isLeader(), lastSeen: Date.now(), isSelf: true }];
  }

  public getTabCount(): number {
    return 1;
  }

  public onRoleChange(listener: RoleListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public resign(): void {
    if (this.role !== 'leader') return;
    this.simulateRole('follower', null);
  }

  public destroy(): void {
    this.destroyed = true;
    this.listeners.clear();
  }

  /** Whether `destroy()` has been called. */
  public isDestroyed(): boolean {
    return this.destroyed;
  }

  /**
   * Test hook — flip the current role and fire every registered
   * `onRoleChange` listener.
   *
   * @param role - `'leader'` or `'follower'`
   * @param leaderId - Optional new leader ID; defaults to this tab when
   *                    role becomes `'leader'` and to `null` otherwise.
   */
  public simulateRole(role: TabRole, leaderId?: string | null): void {
    if (this.role === role) return;
    this.role = role;
    this.leaderId = leaderId ?? (role === 'leader' ? this.tabId : null);
    for (const listener of this.listeners) listener(role);
  }
}
