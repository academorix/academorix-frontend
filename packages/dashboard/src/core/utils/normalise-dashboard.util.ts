/**
 * @file normalise-dashboard.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Fill in fields introduced after the original schema.
 *   Runs on every read of a persisted dashboard so documents written
 *   before a field shipped still parse against today's contract.
 *
 *   Kept small and explicit — adding a field means adding one line
 *   here.
 */

import type { IDashboard } from "@/core/interfaces/dashboard.interface";

import { normaliseLayouts } from "./normalise-layouts.util";

/**
 * Coerce a possibly-stale dashboard document into the current shape.
 *
 * @param entry - Dashboard document as read from storage.
 * @returns Normalised dashboard.
 */
export function normaliseDashboard(entry: IDashboard): IDashboard {
  return {
    ...entry,
    // `density` shipped after the initial release. Undefined maps to
    // the app-wide default so we don't force a persistence-side
    // migration on dashboards that pre-date the field.
    density: entry.density ?? "cozy",
    // Reuse the layout guard so read paths always see one array per
    // breakpoint even after a partial write from an older client.
    layouts: normaliseLayouts(entry.layouts),
  };
}
