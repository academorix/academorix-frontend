/**
 * @file use-current-dashboard.hook.ts
 * @module @stackra/dashboard/react/hooks/use-current-dashboard
 * @description Resolves the currently-active dashboard from the URL
 *   slug + the dashboards registry.
 *
 *   When the slug is missing, the user's `isDefault` dashboard wins.
 *   When no user default exists, the built-in Overview wins.
 */

import { useMemo } from "react";

import type { IDashboard } from "@/core/interfaces/dashboard.interface";

import type { IUseDashboardsResult } from "../use-dashboards/use-dashboards.interface";

import type { IUseCurrentDashboardResult } from "./use-current-dashboard.interface";

/**
 * Sentinel slug that maps to the user's default dashboard. When the
 * URL carries this value, we redirect to the default's real slug.
 */
export const DEFAULT_DASHBOARD_ROUTE_SLUG = "__default__";

/**
 * Pick the dashboard the user should see given the URL slug. Deals
 * with:
 *
 *   - No slug (root `/dashboard`) → default dashboard.
 *   - A slug that matches one of the built-ins or custom dashboards.
 *   - A slug that doesn't match anything (returns `null` so the
 *     caller can 404).
 *
 * @param dashboards - Every dashboard visible to the current user.
 * @param slug - URL slug (may be undefined).
 * @returns The resolved dashboard, or `null` when unresolved.
 */
export function resolveCurrent(
  dashboards: readonly IDashboard[],
  slug: string | undefined,
): IDashboard | null {
  if (dashboards.length === 0) {
    return null;
  }

  if (!slug || slug === DEFAULT_DASHBOARD_ROUTE_SLUG) {
    const explicit = dashboards.find((entry) => entry.isDefault);

    if (explicit) {
      return explicit;
    }

    // The catalogue ships at least one dashboard (Overview) so
    // `dashboards[0]` is guaranteed non-undefined; coerce empty via
    // `?? null` for TypeScript's strictness.
    return dashboards[0] ?? null;
  }

  return dashboards.find((entry) => entry.slug === slug) ?? null;
}

/**
 * Resolve the current dashboard given a registry hook + the slug
 * parameter from the URL. Kept as a pure derivation on top of
 * {@link useDashboards} so consumers can compose the two
 * independently.
 *
 * @param registry - Registry hook result.
 * @param slug - URL slug.
 * @returns The resolved current-dashboard result.
 *
 * @example
 * ```typescript
 * import { useParams } from 'react-router';
 * import { useCurrentDashboard, useDashboards } from '@stackra/dashboard/react';
 *
 * const registry = useDashboards(storage);
 * const { slug } = useParams<{ slug?: string }>();
 * const { current } = useCurrentDashboard(registry, slug);
 * ```
 */
export function useCurrentDashboard(
  registry: IUseDashboardsResult,
  slug: string | undefined,
): IUseCurrentDashboardResult {
  const current = useMemo(
    () => resolveCurrent(registry.dashboards, slug),
    [registry.dashboards, slug],
  );

  return useMemo<IUseCurrentDashboardResult>(
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
