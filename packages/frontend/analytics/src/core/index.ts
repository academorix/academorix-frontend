/**
 * @file index.ts
 * @module @stackra/analytics
 * @description Public API for `@stackra/analytics`. Exports only
 *   package-owned symbols — contract tokens (`ANALYTICS_MANAGER`, …) and
 *   interfaces (`IAnalyticsManager`, …) are imported from `@stackra/contracts`.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { AnalyticsModule } from "./analytics.module";

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export { AnalyticsManager, AnalyticsProviderLoader } from "./services";

// ════════════════════════════════════════════════════════════════════════════════
// Decorators
// ════════════════════════════════════════════════════════════════════════════════
export { AnalyticsProvider, type AnalyticsProviderOptions } from "./decorators";

// ════════════════════════════════════════════════════════════════════════════════
// Built-in providers + their CSP directives
// ════════════════════════════════════════════════════════════════════════════════
export {
  ConsoleAnalyticsProvider,
  Ga4AnalyticsProvider,
  GA4_CSP,
  MetaPixelProvider,
  META_PIXEL_CSP,
  TiktokPixelProvider,
  TIKTOK_PIXEL_CSP,
  SnapchatPixelProvider,
  SNAPCHAT_PIXEL_CSP,
} from "./providers";

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
export { defineConfig, getAnalyticsCspPolicies } from "./utils";

// ════════════════════════════════════════════════════════════════════════════════
// Constants (package-owned)
// ════════════════════════════════════════════════════════════════════════════════
export { CONSENT_CATEGORY_ANALYTICS, CONSENT_CATEGORY_MARKETING } from "./constants";

// ════════════════════════════════════════════════════════════════════════════════
// Types (package-owned)
// ════════════════════════════════════════════════════════════════════════════════
export type {
  IAnalyticsModuleOptions,
  IGa4ProviderOptions,
  IPixelProviderOptions,
  IConsentGate,
  IAnalyticsCspDirectives,
} from "./interfaces";
