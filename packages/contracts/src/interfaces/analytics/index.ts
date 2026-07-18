/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/analytics
 * @description Barrel for analytics / tracking contracts.
 */

export type {
  IAnalyticsEvent,
  IAnalyticsPageView,
  IAnalyticsIdentity,
  IAnalyticsProvider,
} from "./analytics-provider.interface";
export type { IAnalyticsManager } from "./analytics-manager.interface";
