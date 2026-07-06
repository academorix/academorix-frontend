/**
 * @file console.adapter.ts
 * @module @academorix/analytics/adapters/console
 *
 * @description
 * Dev-only adapter that pretty-prints every analytics call to the
 * browser console. Useful during local development + Playwright
 * runs — asserts on event names without spinning up a real backend.
 *
 * @example
 * ```ts
 * import { consoleAnalyticsAdapter } from "@academorix/analytics/adapters/console";
 *
 * // apps/dashboard/src/providers.tsx
 * <AnalyticsProvider adapters={[consoleAnalyticsAdapter]}>{children}</AnalyticsProvider>
 * ```
 */

import type {
  AnalyticsAdapter,
  AnalyticsIdentity,
  AnalyticsPageView,
  AnalyticsProperties,
} from "./analytics-adapter.type";

/**
 * Factory that builds a console adapter with a configurable prefix.
 * Useful when running two adapters in the same page (e.g. product +
 * marketing) and you want the logs disambiguated.
 */
export function createConsoleAnalyticsAdapter(prefix = "[analytics]"): AnalyticsAdapter {
  return {
    name: "console",

    track(name: string, properties?: AnalyticsProperties): void {
      // eslint-disable-next-line no-console
      console.info(`${prefix} track`, name, properties ?? {});
    },

    identify(identity: AnalyticsIdentity): void {
      // eslint-disable-next-line no-console
      console.info(`${prefix} identify`, identity);
    },

    page(view: AnalyticsPageView): void {
      // eslint-disable-next-line no-console
      console.info(`${prefix} page`, view);
    },

    reset(): void {
      // eslint-disable-next-line no-console
      console.info(`${prefix} reset`);
    },
  };
}

/** The default console adapter (prefix `[analytics]`). */
export const consoleAnalyticsAdapter: AnalyticsAdapter = createConsoleAnalyticsAdapter();
