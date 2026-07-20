/**
 * @file use-page-view.hook.ts
 * @module @stackra/analytics/react/hooks
 * @description Fire a page view whenever the given path changes.
 */

import { useEffect } from "react";

import { useAnalytics } from "../use-analytics/use-analytics.hook";

/**
 * Report a page view each time `path` changes. Drop it into your router
 * layout to auto-track navigation.
 *
 * @param path - The current path/route (e.g. from `useLocation().pathname`).
 * @param options - Optional title and extra properties.
 *
 * @example
 * ```tsx
 * const { pathname } = useLocation();
 * usePageView(pathname);
 * ```
 */
export function usePageView(
  path: string,
  options?: { title?: string; properties?: Record<string, unknown> },
): void {
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.page({
      path,
      title: options?.title ?? (typeof document !== "undefined" ? document.title : undefined),
      properties: options?.properties,
    });
    // Re-fire only when the path changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
}
