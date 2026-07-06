/**
 * @file index.ts
 * @module @academorix/analytics
 *
 * @description
 * Public root barrel. Prefer subpath imports for tree-shaking.
 *
 * ## Public API
 *
 *  - {@link "@academorix/analytics/config"} — `defineEvents<T>()`.
 *  - {@link "@academorix/analytics/context"} — `createAnalyticsContext<TEvent>()`
 *    → `{ AnalyticsProvider, useAnalytics }`.
 *  - {@link "@academorix/analytics/adapters"} — `AnalyticsAdapter` interface,
 *    console/Vercel/PostHog/Sentry adapters.
 */

export { defineEvents } from "./config";
export { createAnalyticsContext } from "./context";

export type {
  AnalyticsAdapter,
  AnalyticsIdentity,
  AnalyticsPageView,
  AnalyticsProperties,
} from "./adapters";
export {
  consoleAnalyticsAdapter,
  createConsoleAnalyticsAdapter,
  createSentryAnalyticsAdapter,
  posthogAnalyticsAdapter,
  sentryAnalyticsAdapter,
  vercelAnalyticsAdapter,
} from "./adapters";
export type { SentryAdapterOptions } from "./adapters";

export type {
  AnalyticsContextBundle,
  AnalyticsContextValue,
  AnalyticsProviderProps,
} from "./context";
