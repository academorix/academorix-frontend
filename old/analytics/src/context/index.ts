/**
 * @file index.ts
 * @module @academorix/analytics/context
 *
 * @description
 * Public barrel for the React runtime — the factory that produces an
 * event-registry-bound {AnalyticsProvider, useAnalytics} pair.
 */

export { createAnalyticsContext } from "./create-analytics-context";
export type {
  AnalyticsContextBundle,
  AnalyticsContextValue,
  AnalyticsProviderProps,
} from "./create-analytics-context";
