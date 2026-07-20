/**
 * @file bulk-revoke-filters.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Filter descriptor for
 *   {@link IDashboardStorageAdapter.previewBulkRevoke} and
 *   {@link IDashboardStorageAdapter.bulkRevokeEmbedTokens}.
 */

/**
 * Bulk-revoke filter descriptor. All fields are optional; the caller
 * must populate at least one before submitting.
 */
export interface IBulkRevokeFilters {
  /** Revoke every token issued by the given user. */
  readonly ownerId?: string;

  /** Revoke every token attached to a single shared dashboard. */
  readonly dashboardId?: string;

  /**
   * Revoke every token attached to any of the given dashboards.
   * Additive with {@link IBulkRevokeFilters.dashboardId}.
   */
  readonly dashboardIds?: readonly string[];

  /**
   * Restrict the affected set to tokens created strictly before this
   * ISO date. Useful for "purge everything older than Q1" clean-ups.
   */
  readonly beforeDate?: string;
}
