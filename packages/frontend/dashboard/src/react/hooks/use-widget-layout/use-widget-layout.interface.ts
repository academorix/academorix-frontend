/**
 * @file use-widget-layout.interface.ts
 * @module @stackra/dashboard/react/hooks/use-widget-layout
 * @description Return shape for {@link useWidgetLayout}.
 */

import type { IDashboardLayoutItem } from "@/core/interfaces/dashboard-layout-item.interface";

/**
 * Handle returned by {@link useWidgetLayout}.
 */
export interface IUseWidgetLayoutResult {
  /**
   * Current layout, in render order. When the user has never saved a
   * layout this is the catalogue default; otherwise it's whatever
   * they dragged / resized last.
   */
  items: IDashboardLayoutItem[];

  /**
   * Persist a new layout for this user. Passing an empty array is
   * treated as an explicit reset (equivalent to `resetLayout`).
   */
  setLayout: (next: IDashboardLayoutItem[]) => void;

  /**
   * Clear the saved layout and revert to the catalogue default.
   * Exposed as a separate verb so the "Reset layout" button in the
   * header can call it without constructing an empty array itself.
   */
  resetLayout: () => void;
}
