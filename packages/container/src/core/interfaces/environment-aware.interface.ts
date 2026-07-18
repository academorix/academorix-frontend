/**
 * @file environment-aware.interface.ts
 * @module @stackra/container/src/interfaces
 * @description IEnvironmentAware interface.
 */

/**
 * Interface describing the environment helpers added by the mixin.
 *
 * Consumers can type-check against this interface when they need
 * the environment methods without knowing the full class.
 */
export interface IEnvironmentAware {
  /** Current environment name (e.g., "production", "development"). */
  readonly environment: string;

  /** Whether the app is running in production. */
  readonly isProduction: boolean;

  /** Whether the app is running in development/local. */
  readonly isDevelopment: boolean;

  /** Whether the app is running in a testing environment. */
  readonly isTesting: boolean;

  /** Whether the app is running in staging. */
  readonly isStaging: boolean;

  /** Whether debug mode is enabled. */
  readonly isDebug: boolean;

  /** Check if the current environment matches a given name. */
  isEnvironment(name: string): boolean;
}
