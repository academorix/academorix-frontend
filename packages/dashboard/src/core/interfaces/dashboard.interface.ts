/**
 * @file dashboard.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description The full dashboard document — the shape the backend
 *   serialises and the shape the storage adapter reads and writes.
 */

import type { DashboardBreakpoint } from "@/core/types/dashboard-breakpoint.type";
import type { DashboardDensity } from "@/core/types/dashboard-density.type";
import type { DashboardLayoutMode } from "@/core/types/dashboard-layout-mode.type";
import type { DashboardShareLevel } from "@/core/types/dashboard-share-level.type";
import type { DashboardVisibility } from "@/core/types/dashboard-visibility.type";

import type { IDashboardFilters } from "./dashboard-filters.interface";
import type { ILayoutItem } from "./layout-item.interface";
import type { IWidgetInstance } from "./widget-instance.interface";

/**
 * The full dashboard document.
 */
export interface IDashboard {
  /** UUID primary key. */
  id: string;

  /** Owning tenant (server-enforced in production). */
  tenantId: string;

  /** Owner user id. */
  ownerId: string;

  /** Human-facing name. */
  name: string;

  /** URL slug — `/dashboard/{slug}` resolves to this dashboard. */
  slug: string;

  /** Iconify token from the shared icon set. Optional. */
  icon?: string;

  /**
   * Accent color from the palette — any HeroUI semantic token
   * (`accent`, `success`, `danger`) or a hand-picked hex. Optional.
   */
  color?: string;

  /** Visibility scope controlling embed-token issue. */
  visibility: DashboardVisibility;

  /**
   * In-app access scope. Defaults to `"private"`. See
   * {@link DashboardShareLevel} for the axis compared to
   * {@link visibility}.
   */
  shareLevel: DashboardShareLevel;

  /** Sidebar-pin flag. */
  isPinned: boolean;

  /** "User's default dashboard" flag. At most one per user. */
  isDefault: boolean;

  /**
   * Whether the dashboard is built into the app rather than persisted.
   * Built-ins (Overview, Analytics) can be viewed but never renamed,
   * deleted, or reordered.
   */
  isBuiltIn: boolean;

  /** Layout engine mode. */
  layoutMode: DashboardLayoutMode;

  /**
   * Spacing density applied to the widget canvas. Optional so a
   * dashboard document written before the field shipped still parses;
   * read paths default `undefined` to `"cozy"`.
   */
  density?: DashboardDensity;

  /** Per-breakpoint layout arrays. */
  layouts: Record<DashboardBreakpoint, readonly ILayoutItem[]>;

  /** Widget instances placed on the dashboard. */
  widgets: readonly IWidgetInstance[];

  /** Dashboard-level filter defaults propagated to opted-in widgets. */
  filters?: IDashboardFilters;

  /**
   * Optimistic-locking version. Increments on every mutating
   * operation. A mismatch on update throws {@link OptimisticLockError}.
   */
  version: number;

  /** ISO-8601 creation timestamp. */
  createdAt: string;

  /** ISO-8601 last-mutation timestamp. */
  updatedAt: string;
}
