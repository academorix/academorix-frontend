/**
 * @file create-dashboard-input.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Payload for {@link IDashboardStorageAdapter.create}.
 */

import type { DashboardDensity } from "@/core/types/dashboard-density.type";
import type { DashboardLayoutMode } from "@/core/types/dashboard-layout-mode.type";
import type { DashboardShareLevel } from "@/core/types/dashboard-share-level.type";
import type { DashboardVisibility } from "@/core/types/dashboard-visibility.type";

/**
 * Options for creating a new dashboard.
 */
export interface ICreateDashboardInput {
  /** Human-facing name. */
  name: string;

  /** Iconify token from the shared icon set. */
  icon?: string;

  /** Accent colour. */
  color?: string;

  /** Visibility scope. Defaults to `"private"`. */
  visibility?: DashboardVisibility;

  /**
   * Initial in-app access scope. Defaults to `"private"`. Grants can
   * be added afterwards via the share dialog.
   */
  shareLevel?: DashboardShareLevel;

  /** Layout engine mode. Defaults to `"grid"`. */
  layoutMode?: DashboardLayoutMode;

  /** Initial spacing density. Defaults to `"cozy"`. */
  density?: DashboardDensity;

  /** Template id to seed initial widgets + layouts from. */
  fromTemplate?: string;

  /**
   * Id of a source dashboard to duplicate. Overrides `fromTemplate`
   * when both are set; the widgets + layouts are deep-copied with
   * fresh ids.
   */
  duplicateOf?: string;
}
