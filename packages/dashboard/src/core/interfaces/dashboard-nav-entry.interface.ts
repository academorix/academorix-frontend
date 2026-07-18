/**
 * @file dashboard-nav-entry.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Sidebar / palette navigation projection — a small subset
 *   of {@link IDashboard} used by the app shell.
 */

/**
 * Small navigation projection of a dashboard. Chrome-friendly shape —
 * hides tenancy + versioning + widgets that navigation doesn't need.
 */
export interface IDashboardNavEntry {
  /** UUID primary key. */
  id: string;

  /** Human-facing name. */
  name: string;

  /** URL slug. */
  slug: string;

  /** Iconify token. */
  icon?: string;

  /** Accent colour. */
  color?: string;

  /** Whether the dashboard is a built-in (Overview, Analytics). */
  isBuiltIn: boolean;

  /** Sidebar-pin flag. */
  isPinned: boolean;

  /** "User's default dashboard" flag. */
  isDefault: boolean;
}
