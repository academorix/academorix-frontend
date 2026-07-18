/**
 * @file dashboard-access-subject.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Viewer descriptor consumed by
 *   {@link canAccessDashboard}. Kept intentionally minimal so this
 *   helper stays independent of the eventual auth surface — every
 *   consumer synthesises this from whatever identity source they have.
 */

/**
 * Minimal viewer identity for `canAccessDashboard` checks.
 */
export interface IDashboardAccessSubject {
  /** Stable user id. Compared verbatim against `user`-typed grants. */
  id: string;

  /**
   * Role slugs (lowercase, matching {@link IDashboardShareGrant.targetId}).
   * A viewer whose list contains `"admin"` bypasses every access rule.
   */
  roles: readonly string[];
}
