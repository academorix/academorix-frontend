/**
 * @file update-dashboard-input.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Partial-update payload for
 *   {@link IDashboardStorageAdapter.update}. `version` is required so
 *   the storage layer can enforce optimistic locking.
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
 * Partial-update payload. `version` is required for optimistic lock.
 */
export interface IUpdateDashboardInput {
  /** Client-observed version at the time of the update. */
  version: number;

  /** New display name. */
  name?: string;

  /** New slug. Deduplicated server-side on write. */
  slug?: string;

  /** New iconify token. */
  icon?: string;

  /** New accent colour. */
  color?: string;

  /** New visibility scope. */
  visibility?: DashboardVisibility;

  /** New in-app access scope. */
  shareLevel?: DashboardShareLevel;

  /** New sidebar-pin flag. */
  isPinned?: boolean;

  /**
   * Set to `true` to promote this dashboard to the user's default. At
   * most one dashboard per user carries `isDefault === true`; the
   * storage layer clears every sibling in the same write.
   */
  isDefault?: boolean;

  /** New layout engine mode. */
  layoutMode?: DashboardLayoutMode;

  /** New spacing density. */
  density?: DashboardDensity;

  /** New per-breakpoint layout arrays. */
  layouts?: Record<DashboardBreakpoint, readonly ILayoutItem[]>;

  /** New widget instances. */
  widgets?: readonly IWidgetInstance[];

  /** New dashboard-level filter defaults. */
  filters?: IDashboardFilters;
}
