/**
 * @file define-router-config.util.ts
 * @module @stackra/routing/core/utils
 * @description Typed identity helper for authoring
 *   `react-router.config.ts` — the build-time entry the Vite `router()`
 *   plugin reads (F.3) and the `<StackraRoutingProvider>` reads at
 *   runtime (F.2).
 *
 *   Note: the `ssr` field intentionally does NOT appear on
 *   `IRouterConfig` — the routing package is locked to `ssr: false`.
 *   Consumers who need runtime SSR drop to raw RRv7 config (not our
 *   supported path).
 */

import type { IRouterConfig } from "@stackra/contracts";

/**
 * Typed identity for a router config.
 *
 * @param config - Root routes + optional basename / rootDomain.
 * @returns The same object, strictly typed against `IRouterConfig`.
 *
 * @example
 * ```typescript
 * // react-router.config.ts
 * import { defineRouterConfig } from '@stackra/routing';
 * import { routes } from './src/routes';
 *
 * export default defineRouterConfig({ basename: '/', routes });
 * ```
 */
export function defineRouterConfig(config: IRouterConfig): IRouterConfig {
  return config;
}
