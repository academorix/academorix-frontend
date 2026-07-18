/**
 * @file use-widget-layout.ts
 * @module modules/dashboard/hooks/use-widget-layout
 *
 * @description
 * Backward-compat shim. The hook itself lives in
 * `@stackra/dashboard/react` — this file wraps it so existing app
 * consumers keep their zero-arg contract (the package version takes
 * `defaultLayoutWidgetKeys` + `catalogueByKey` as inputs, both of
 * which live on the app-side legacy catalogue).
 */

import type { IDashboardLayoutItem } from "@stackra/dashboard";
import {
  clearStoredLayout as packageClearStoredLayout,
  computeDefaultLayoutItems as packageComputeDefaultLayoutItems,
  LAYOUT_SCHEMA_VERSION,
  OVERVIEW_GRID_COLUMNS,
  readStoredLayout as packageReadStoredLayout,
  useWidgetLayout as usePackageWidgetLayout,
  writeStoredLayout,
} from "@stackra/dashboard/react";
import type { IUseWidgetLayoutResult } from "@stackra/dashboard/react";

import {
  defaultLayoutWidgetKeys,
  widgetCatalogueByKey,
} from "@/modules/dashboard/widgets/widget.catalogue";

// ── Re-exports (unchanged shape) ──────────────────────────────────
export { LAYOUT_SCHEMA_VERSION, OVERVIEW_GRID_COLUMNS, writeStoredLayout };

/**
 * Legacy `computeDefaultLayoutItems()` — binds to the app-side
 * catalogue defaults.
 */
export function computeDefaultLayoutItems(): IDashboardLayoutItem[] {
  return packageComputeDefaultLayoutItems(defaultLayoutWidgetKeys, widgetCatalogueByKey);
}

/**
 * Legacy `readStoredLayout(userId)` — auto-binds the catalogue.
 */
export function readStoredLayout(userId: string): IDashboardLayoutItem[] | null {
  return packageReadStoredLayout(userId, widgetCatalogueByKey);
}

/**
 * Legacy `clearStoredLayout(userId)` — the package's signature
 * already matches; kept re-exported for symmetry.
 */
export function clearStoredLayout(userId: string): void {
  packageClearStoredLayout(userId);
}

/**
 * Return shape re-export so app consumers keep the historical
 * `UseWidgetLayoutResult` alias.
 */
export type UseWidgetLayoutResult = IUseWidgetLayoutResult;

/**
 * Legacy `useWidgetLayout(userId)` — signature: pass the userId,
 * the catalogue defaults are auto-bound.
 */
export function useWidgetLayout(userId: string | null | undefined): UseWidgetLayoutResult {
  return usePackageWidgetLayout({
    userId,
    defaultLayoutWidgetKeys,
    catalogueByKey: widgetCatalogueByKey,
  });
}
