/**
 * @file use-route-analytics.hook.ts
 * @module @stackra/routing/react/hooks/use-route-analytics
 * @description Fire the current route's `analytics` event on every
 *   route change.
 *
 *   The hook subscribes to `useMatches()` and calls
 *   `RouteAnalyticsService.emit(...)` when the leaf match changes.
 *   `RouteAnalyticsService` is optional — apps without analytics
 *   wire nothing, and the hook becomes a no-op.
 */

import { useEffect } from "react";
import { useLocation, useMatches } from "react-router";
import { useContainer } from "@stackra/container/react";

import { RouteAnalyticsService } from "@/analytics/services/route-analytics.service";

/**
 * Fire the current route's `analytics` event on every route change.
 *
 * @example
 * ```typescript
 * function App() {
 *   useRouteAnalytics();
 *   return <RouterProvider ... />;
 * }
 * ```
 */
export function useRouteAnalytics(): void {
  const container = useContainer();
  const matches = useMatches();
  const location = useLocation();

  useEffect(() => {
    if (matches.length === 0) return;
    const leaf = matches[matches.length - 1]!;
    // Analytics lives on the well-known `handle.analytics` field. The
    // adapter also mirrors it into the private bag; we read the well-
    // known field here so authors can override on `defineRoute(...)`.
    const analytics = (leaf.handle as { analytics?: unknown } | undefined)?.analytics;
    if (analytics === undefined) return;
    // Resolve the analytics service from the container. Optional —
    // the `RouteAnalyticsService` itself no-ops when
    // `IAnalyticsManager` isn't wired.
    let service: RouteAnalyticsService | undefined;
    try {
      service = container.get(RouteAnalyticsService);
    } catch {
      // fail-soft — routing works without analytics wired.
    }
    if (!service) return;

    const url = new URL(location.pathname + location.search, "http://placeholder/");
    // Build the page context handed to function-valued `analytics`.
    const context = {
      data: leaf.data,
      params: leaf.params,
      matches,
      request: new Request(url.toString()),
      url,
    };
    service.emit(analytics, context);
  }, [matches, location.pathname, location.search, container]);
}
