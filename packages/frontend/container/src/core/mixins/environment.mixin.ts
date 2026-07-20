/**
 * Environment Mixin
 *
 * Adds environment detection helpers to any class. Applied to
 * `ApplicationContext` so consumers can check `app.isProduction`,
 * `app.isDevelopment`, etc. without importing `Env` directly.
 *
 * Uses the mixin pattern — a function that takes a base class and
 * returns an extended class with the environment methods.
 *
 * @module @stackra/container/mixins
 */

/**
 * Read an environment variable. Works in both Node.js and browser (Vite).
 */
export function env<T = string>(key: string, fallback?: T): T | undefined {
  if (typeof process !== "undefined" && process.env) {
    const value = process.env[key];
    if (value !== undefined) return value as unknown as T;
  }
  // Vite injects import.meta.env at build time (use indirect eval to avoid CJS ESM detection)
  try {
    const getMeta = new Function(
      'return typeof import.meta !== "undefined" ? import.meta : undefined',
    );
    const meta = getMeta() as Record<string, unknown> | undefined;
    if (meta && meta.env && typeof meta.env === "object") {
      const value = (meta.env as Record<string, unknown>)[key];
      if (value !== undefined) return value as unknown as T;
    }
  } catch {
    // import.meta not available
  }
  return fallback;
}

/**
 * Constructor type for mixin compatibility.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = object> = new (...args: any[]) => T;

import { Str } from "@stackra/support";

import type { IEnvironmentAware } from "@/core/interfaces/environment-aware.interface";

export type { IEnvironmentAware };

/**
 * Environment mixin — adds environment detection to any class.
 *
 * @param Base - The base class to extend
 * @returns A new class with environment helpers
 *
 * @example
 * ```typescript
 * class MyApp extends WithEnvironment(BaseClass) {
 *   boot() {
 *     if (this.isDevelopment) {
 *       logger.info("Dev mode — extra logging enabled");
 *     }
 *   }
 * }
 * ```
 */
export function WithEnvironment<TBase extends Constructor>(Base: TBase) {
  return class EnvironmentMixin extends Base implements IEnvironmentAware {
    /**
     * Current environment name.
     *
     * Reads from `APP_ENV` or `NODE_ENV`. Defaults to `"production"`.
     *
     * @example
     * ```typescript
     * app.environment; // "development"
     * ```
     */
    public get environment(): string {
      // Route the case-fold through `Str.lower` per
      // `.kiro/steering/support-utilities.md` instead of a bare
      // `.toLowerCase()`.
      return Str.lower(env("APP_ENV") ?? env("NODE_ENV") ?? "production");
    }

    /**
     * Whether the app is running in production.
     *
     * @example
     * ```typescript
     * if (app.isProduction) {
     *   // disable debug logging, enable caching
     * }
     * ```
     */
    public get isProduction(): boolean {
      return this.environment === "production";
    }

    /**
     * Whether the app is running in development or local.
     *
     * @example
     * ```typescript
     * if (app.isDevelopment) {
     *   // enable hot reload, verbose errors
     * }
     * ```
     */
    public get isDevelopment(): boolean {
      const env = this.environment;
      return env === "development" || env === "local" || env === "dev";
    }

    /**
     * Whether the app is running in a testing environment.
     *
     * @example
     * ```typescript
     * if (app.isTesting) {
     *   // use mock services, disable network calls
     * }
     * ```
     */
    public get isTesting(): boolean {
      const env = this.environment;
      return env === "testing" || env === "test";
    }

    /**
     * Whether the app is running in staging.
     *
     * @example
     * ```typescript
     * if (app.isStaging) {
     *   // enable feature flags for QA
     * }
     * ```
     */
    public get isStaging(): boolean {
      return this.environment === "staging";
    }

    /**
     * Whether debug mode is enabled.
     *
     * Reads from `DEBUG` env var. Also true in development.
     *
     * @example
     * ```typescript
     * if (app.isDebug) {
     *   // expose devtools, verbose logging
     * }
     * ```
     */
    public get isDebug(): boolean {
      return env<boolean>("DEBUG", false) || this.isDevelopment;
    }

    /**
     * Check if the current environment matches a given name.
     *
     * Case-insensitive comparison.
     *
     * @param name - Environment name to check
     * @returns `true` if the current environment matches
     *
     * @example
     * ```typescript
     * app.isEnvironment("staging"); // true/false
     * ```
     */
    public isEnvironment(name: string): boolean {
      // Route the case-fold through `Str.lower` per
      // `.kiro/steering/support-utilities.md` instead of a bare
      // `.toLowerCase()`.
      return this.environment === Str.lower(name);
    }
  };
}
