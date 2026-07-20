/**
 * @file index.ts
 * @module @stackra/analytics/core/interfaces
 * @description Barrel for package-owned analytics interfaces.
 */

export type { IConsentGate } from "./consent-gate.interface";
export type { IAnalyticsCspDirectives } from "./analytics-csp.interface";
export type {
  IAnalyticsInstanceConfig,
  IAnalyticsModuleOptions,
  IGa4ProviderOptions,
  IPixelProviderOptions,
} from "./analytics-module-options.interface";
