/**
 * @file use-current-dashboard.ts
 * @module modules/dashboard/dashboards/use-current-dashboard
 *
 * @description
 * Resolves the currently-active dashboard from the URL slug + the
 * dashboards registry. When the slug is missing (`/dashboard`) the
 * user's `isDefault` dashboard wins; when no user default exists, the
 * `Overview` built-in wins.
 *
 * Returns a triple:
 *
 *   * `dashboard` — the resolved document, or `null` while the list
 *     is loading.
 *   * `dashboards` — the full registry (built-ins + custom).
 *   * `resolveHref` — helper that turns a dashboard record into a
 *     router-safe path. Kept here so callers don't hand-build
 *     `/dashboard/${slug}` all over the app.
 */

import { useMemo } from "react";

import type { Dashboard } from "@/modules/dashboard/dashboards/types";
import type { UseDashboardsResult } from "@/modules/dashboard/dashboards/use-dashboards";

/**
 * The slug that maps to the user's default dashboard. When the URL
 * carries this value, we redirect to the default's real slug.
 */
export const DEFAULT_DASHBOARD_ROUTE_SLUG = "__default__";

/**
 * Pick the dashboard the user should see given the URL slug. Deals
 * with:
 *
 *   * No slug (root `/dashboard`) → default dashboard.
 *   * A slug that matches one of the built-ins or custom dashboards.
 *   * A slug that doesn't match anything (returns `null` so the
 *     caller can 404).
 */
export function resolveCurrent(
  dashboards: readonly Dashboard[],
  slug: string | undefined,
): Dashboard | null {
  if (dashboards.length === 0) {
    return null;
  }

  if (!slug || slug === DEFAULT_DASHBOARD_ROUTE_SLUG) {
    const explicit = dashboards.find((entry) => entry.isDefault);

    if (explicit) {
      return explicit;
    }

    // Built-in `Overview` is the last-resort default.
    return dashboards[0];
  }

  return dashboards.find((entry) => entry.slug === slug) ?? null;
}

/**
 * Build the router-safe path for a dashboard.
 */
export function dashboardHref(dashboard: Dashboard): string {
  return `/dashboard/${dashboard.slug}`;
}

/** Public shape returned by {@link useCurrentDashboard}. */
export interface UseCurrentDashboardResult {
  dashboards: readonly Dashboard[];
  current: Dashboard | null;
  isLoading: boolean;
  isMutating: boolean;
  error: Error | null;
  /** Registry mutators forwarded verbatim. */
  registry: UseDashboardsResult;
}

/**
 * Resolve the current dashboard given a registry hook + the slug
 * parameter from the URL. Kept as a pure derivation on top of
 * {@link useDashboards} so consumers can compose the two independently.
 */
export function useCurrentDashboard(
  registry: UseDashboardsResult,
  slug: string | undefined,
): UseCurrentDashboardResult {
  const current = useMemo(
    () => resolveCurrent(registry.dashboards, slug),
    [registry.dashboards, slug],
  );

  return useMemo<UseCurrentDashboardResult>(
    () => ({
      dashboards: registry.dashboards,
      current,
      isLoading: registry.isLoading,
      isMutating: registry.isMutating,
      error: registry.error,
      registry,
    }),
    [current, registry],
  );
}
