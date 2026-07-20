/**
 * @file use-analytics.hook.ts
 * @module @stackra/analytics/react/hooks
 * @description Resolve the AnalyticsManager from the DI container.
 */

import { useInject } from "@stackra/container/react";
import { ANALYTICS_MANAGER } from "@stackra/contracts";
import type { IAnalyticsManager } from "@stackra/contracts";

/**
 * Resolve the {@link IAnalyticsManager} from the surrounding
 * `ContainerProvider`.
 *
 * @returns The analytics manager.
 *
 * @example
 * ```tsx
 * const analytics = useAnalytics();
 * analytics.track('cta_clicked', { id: 'hero' });
 * ```
 */
export function useAnalytics(): IAnalyticsManager {
  return useInject<IAnalyticsManager>(ANALYTICS_MANAGER);
}
