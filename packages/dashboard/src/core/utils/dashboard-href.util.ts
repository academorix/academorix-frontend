/**
 * @file dashboard-href.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Build the router-safe path for a dashboard. Kept
 *   framework-agnostic so consumers can pass the result to any
 *   router.
 */

import type { IDashboard } from "@/core/interfaces/dashboard.interface";

/**
 * Return the canonical URL path for a dashboard.
 *
 * @param dashboard - Dashboard whose route we want.
 * @returns Router-safe path — always `/dashboard/{slug}`.
 */
export function dashboardHref(dashboard: IDashboard): string {
  return `/dashboard/${dashboard.slug}`;
}
