/**
 * @file monitoring.config.ts
 * @module @stackra/monitoring/config
 * @description Application-level error-monitoring configuration.
 *   Consumed by `MonitoringModule.forRoot()` at bootstrap.
 */

import { defineConfig } from "@stackra/monitoring";

export const monitoringConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Default Instance
  |--------------------------------------------------------------------------
  |
  | Named provider returned by `monitoring.provider()` when called with
  | no argument. Must be a key of `providers` below.
  |
  */
  default: "console",

  /*
  |--------------------------------------------------------------------------
  | Environment Tag
  |--------------------------------------------------------------------------
  |
  | Applied to every reported exception + breadcrumb across all
  | providers. Sentry / Bugsnag / Datadog surface this in their UI as
  | the deployment environment.
  |
  */
  environment: "development",

  /*
  |--------------------------------------------------------------------------
  | Providers
  |--------------------------------------------------------------------------
  |
  | Named provider registrations keyed by instance name. Each selects
  | a `driver` (`console`, `sentry`, ...) plus driver-specific fields.
  | An instance with a missing required field auto-disables — you can
  | wire `dsn: import.meta.env.VITE_SENTRY_DSN` unconditionally and
  | let Monitoring skip it when the env var is unset.
  |
  */
  providers: {
    console: { driver: "console" },
    // sentry: {
    //   driver: 'sentry',
    //   dsn: import.meta.env.VITE_SENTRY_DSN,
    //   tracesSampleRate: 0.1,
    // },
  },

  /*
  |--------------------------------------------------------------------------
  | Stack (fan-out order)
  |--------------------------------------------------------------------------
  |
  | Every entry in this list receives every exception + breadcrumb in
  | order. Defaults to every configured provider — narrow it here to
  | send prod-only signal to specific destinations.
  |
  */
  stack: ["console"],
});
