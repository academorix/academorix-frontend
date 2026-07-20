/**
 * @file analytics.config.ts
 * @module @stackra/analytics/config
 * @description Application-level analytics configuration.
 *   Consumed by `AnalyticsModule.forRoot()` at bootstrap.
 */

import { defineConfig } from "@stackra/analytics";

export const analyticsConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Default Instance
  |--------------------------------------------------------------------------
  |
  | Named provider returned by `analytics.provider()` when called with
  | no argument. Must be a key of `providers` below.
  |
  */
  default: "console",

  /*
  |--------------------------------------------------------------------------
  | Providers
  |--------------------------------------------------------------------------
  |
  | Named provider registrations keyed by instance name. Each selects
  | a `driver` (`console`, `ga4`, `meta-pixel`, `tiktok-pixel`, ...)
  | plus driver-specific fields (`measurementId`, `pixelId`, ...).
  | A provider with a missing required field auto-disables — you can
  | wire `measurementId: import.meta.env.VITE_GA4_ID` unconditionally
  | and let the module skip it when the env var is unset.
  |
  */
  providers: {
    console: { driver: "console" },
    // ga4: {
    //   driver: 'ga4',
    //   measurementId: import.meta.env.VITE_GA4_ID,
    //   consentCategory: 'analytics',
    // },
    // 'meta-pixel': {
    //   driver: 'meta-pixel',
    //   pixelId: import.meta.env.VITE_META_PIXEL_ID,
    //   consentCategory: 'marketing',
    // },
  },

  /*
  |--------------------------------------------------------------------------
  | Stack (fan-out order)
  |--------------------------------------------------------------------------
  |
  | Every entry receives every dispatched event. Defaults to all
  | configured providers.
  |
  */
  stack: ["console"],

  /*
  |--------------------------------------------------------------------------
  | Consent Gating
  |--------------------------------------------------------------------------
  |
  | When a provider declares a `consentCategory` and no consent
  | manager is wired, decide whether to require consent
  | (fail-closed) or fire anyway. Privacy-first default.
  |
  */
  requireConsent: true,

  /*
  |--------------------------------------------------------------------------
  | Pre-Consent Buffering
  |--------------------------------------------------------------------------
  |
  | Buffer events dispatched before the user grants consent and
  | replay them when the relevant category becomes granted.
  |
  */
  bufferUntilConsent: true,
  bufferLimit: 100,
});
