/**
 * @file dashboard-filters.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Optional dashboard-level filters propagated to every
 *   opted-in widget. Widgets that don't opt in ignore these fields.
 */

/**
 * Dashboard-level filter overrides. Family-grouped `scope` object stays
 * inline because it is used only in service of {@link IDashboardFilters}
 * (no consumer imports the inner shape directly).
 */
export interface IDashboardFilters {
  /** ISO-8601 inclusive start date. */
  dateFrom?: string;

  /** ISO-8601 inclusive end date. */
  dateTo?: string;

  /** Scope overrides — pin a dashboard to a specific slice. */
  scope?: {
    /** Organization identifier the dashboard is pinned to. */
    organizationId?: string;
    /** Branch identifier the dashboard is pinned to. */
    branchId?: string;
    /** Season identifier the dashboard is pinned to. */
    seasonId?: string;
    /** Cohort identifier the dashboard is pinned to. */
    cohortId?: string;
  };
}
