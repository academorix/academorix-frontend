/**
 * @file create-share-grant-input.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Payload for
 *   {@link IDashboardStorageAdapter.addShareGrant}. The server mints
 *   `id`, `dashboardId`, `grantedBy`, and `grantedAt` so the client
 *   only supplies the target triple.
 */

/**
 * Client-supplied fields for a new share grant. Mirrors the subset of
 * {@link IDashboardShareGrant} the caller controls at issue time —
 * server-minted fields (`id`, `dashboardId`, `grantedBy`, `grantedAt`)
 * are omitted here so the interface reads as a hand-authored contract
 * without a `Pick`-driven indirection.
 */
export interface ICreateShareGrantInput {
  /** Target kind — `role`, `user`, or `everyone`. */
  targetType: "role" | "user" | "everyone";

  /** Role slug, user id, or `"*"` for `everyone`. */
  targetId: string;

  /** Display label frozen at grant time. */
  targetLabel: string;
}
