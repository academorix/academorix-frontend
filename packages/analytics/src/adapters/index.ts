/**
 * @file index.ts
 * @module @academorix/analytics/adapters
 *
 * @description
 * Public barrel for the pluggable analytics adapters. Each concrete
 * adapter is also exported as its own subpath so apps that don't use
 * one don't pull the module into their bundle:
 *
 *   - `@academorix/analytics/adapters/console`
 *   - `@academorix/analytics/adapters/vercel`
 *   - `@academorix/analytics/adapters/posthog`
 *   - `@academorix/analytics/adapters/sentry`
 */

export type {
  AnalyticsAdapter,
  AnalyticsIdentity,
  AnalyticsPageView,
  AnalyticsProperties,
} from "./analytics-adapter.type";

export { consoleAnalyticsAdapter, createConsoleAnalyticsAdapter } from "./console.adapter";
export { vercelAnalyticsAdapter } from "./vercel.adapter";
export { posthogAnalyticsAdapter } from "./posthog.adapter";
export { createSentryAnalyticsAdapter, sentryAnalyticsAdapter } from "./sentry.adapter";
export type { SentryAdapterOptions } from "./sentry.adapter";
