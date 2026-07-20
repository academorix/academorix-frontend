/**
 * @file monitoring-module-options.interface.ts
 * @module @stackra/monitoring/core/interfaces
 * @description Package-owned configuration shape for MonitoringModule.
 *   Mirrors the cache/logger model: a map of named provider instances
 *   (each selecting a `driver`) plus an optional `stack` that scopes which
 *   ones receive fan-out.
 */

/**
 * Configuration for a single named monitoring instance. `driver` selects
 * the implementation (`console`, `sentry`, or a custom-registered driver);
 * remaining fields are driver-specific.
 */
export interface IMonitoringInstanceConfig {
  /** Driver name (e.g. `sentry`, `console`). */
  driver: string;
  /**
   * Explicitly disable this instance without removing it. Also auto-false
   * when a built-in driver's required field is missing (e.g. Sentry
   * without a `dsn`) — so you can wire `dsn: import.meta.env.VITE_SENTRY_DSN`
   * unconditionally and let the module skip it when unset.
   */
  enabled?: boolean;
  /** Driver-specific options. */
  [key: string]: unknown;
}

/** Options consumed by the built-in Sentry driver. */
export interface ISentryProviderOptions {
  /** Sentry DSN. Required for the Sentry driver. */
  dsn: string;
  /** Environment tag (falls back to the module `environment`). */
  environment?: string;
  /** Release identifier (falls back to the module `release`). */
  release?: string;
  /** Performance trace sample rate `0..1`. */
  tracesSampleRate?: number;
}

/**
 * Configuration for `MonitoringModule.forRoot(...)`.
 */
export interface IMonitoringModuleOptions {
  /** Default instance name for named access via `provider(name)`. */
  default?: string;

  /** Global environment tag applied to all providers (e.g. `production`). */
  environment?: string;

  /** Global release identifier applied to all providers. */
  release?: string;

  /**
   * Named provider instances, keyed by instance name. Each selects a
   * `driver`. Example:
   *
   * ```ts
   * providers: {
   *   console: { driver: 'console' },
   *   sentry:  { driver: 'sentry', dsn: '…', tracesSampleRate: 0.1 },
   * }
   * ```
   */
  providers?: Record<string, IMonitoringInstanceConfig>;

  /**
   * Which instances receive fan-out (`captureException`, …). Defaults to
   * every configured instance. Use it to send to a subset (e.g. only
   * `sentry` in production).
   */
  stack?: string[];
}
