/**
 * @file dashboard-share-grant.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description A single access grant for a `role-restricted` dashboard.
 *   Grants are additive — a user matching any grant sees the dashboard.
 */

/**
 * Access grant tying a dashboard to a role, user, or the "everyone"
 * sentinel. Grants are additive; a user matches when any single grant
 * hits.
 *
 * `targetType` discriminates the semantics of {@link targetId}:
 *
 * - `role` — `targetId` is a role slug (e.g. `"coach"`).
 * - `user` — `targetId` is a stable user id.
 * - `everyone` — `targetId` is the literal `"*"`; matches every tenant
 *   member. Handy for temporarily opening a restricted dashboard.
 */
export interface IDashboardShareGrant {
  /** UUID primary key. */
  id: string;

  /** Owning dashboard. Cascade-deleted with the dashboard row. */
  dashboardId: string;

  /** Target kind — see the interface docblock for the discriminator. */
  targetType: "role" | "user" | "everyone";

  /** Role slug, user id, or `"*"` for `everyone`. */
  targetId: string;

  /** Display label frozen at grant time. */
  targetLabel: string;

  /** User id of the granter — used by the audit log. */
  grantedBy: string;

  /** ISO-8601 timestamp when the grant was minted. */
  grantedAt: string;
}
