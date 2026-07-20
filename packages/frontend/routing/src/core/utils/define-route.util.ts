/**
 * @file define-route.util.ts
 * @module @stackra/routing/core/utils
 * @description Typed identity helper for authoring a single route
 *   record. Consumers write their route tree against
 *   `defineRoute({...})` for IDE hover + type completion; the helper
 *   performs no runtime processing.
 */

import type { IRouteRecord } from "@stackra/contracts";

/**
 * Typed identity for a route record.
 *
 * @typeParam TParams - Path param bag.
 * @typeParam TData   - Loader return type.
 *
 * @param config - Route record.
 * @returns The same object, strictly typed against `IRouteRecord`.
 *
 * @example
 * ```typescript
 * import { defineRoute } from '@stackra/routing';
 *
 * export const dashboardRoute = defineRoute({
 *   path: '/dashboard',
 *   lazy: () => import('./dashboard.page'),
 * });
 * ```
 */
export function defineRoute<TParams = Record<string, string>, TData = unknown>(
  config: IRouteRecord<TParams, TData>,
): IRouteRecord<TParams, TData> {
  return config;
}
