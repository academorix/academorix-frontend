/**
 * @file env.ts
 * @module @stackra/support
 * @description Environment variable access helpers.
 *   Provides typed, safe access to environment variables with defaults,
 *   type coercion, and environment detection. Works in both Node.js
 *   (process.env) and browser (import.meta.env / window.__ENV__) contexts.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Env Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Static environment variable access utility.
 *
 * Provides safe, typed access to environment variables with sensible defaults.
 * Supports both server-side (process.env) and client-side environments.
 *
 * @example
 * ```typescript
 * import { Env } from '@stackra/support';
 *
 * const dbHost = Env.get('DB_HOST', 'localhost');
 * const port = Env.getNumber('PORT', 3000);
 * const debug = Env.getBoolean('DEBUG', false);
 *
 * if (Env.isProduction()) {
 *   enableCaching();
 * }
 * ```
 */
export class Env {
  // ══════════════════════════════════════════════════════════════════════════
  // Value Retrieval
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get an environment variable value, or return a default.
   *
   * @param key - The environment variable name
   * @param defaultValue - Value to return if the variable is not set (default: '')
   * @returns The environment variable value or the default
   *
   * @example
   * ```typescript
   * Env.get('API_URL', 'http://localhost:3000');
   * Env.get('APP_NAME', 'MyApp');
   * ```
   */
  public static get(key: string, defaultValue: string = ""): string {
    const value = Env.resolve(key);
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }
    return value;
  }

  /**
   * Get an environment variable or throw if it's not set.
   *
   * Use this for required configuration that has no sensible default.
   *
   * @param key - The environment variable name
   * @returns The environment variable value
   * @throws Error if the variable is not set or empty
   *
   * @example
   * ```typescript
   * const secret = Env.getOrFail('JWT_SECRET');
   * // Throws: "Environment variable [JWT_SECRET] is not set."
   * ```
   */
  public static getOrFail(key: string): string {
    const value = Env.resolve(key);
    if (value === undefined || value === null || value === "") {
      throw new Error(`Environment variable [${key}] is not set.`);
    }
    return value;
  }

  /**
   * Get an environment variable as a number.
   *
   * @param key - The environment variable name
   * @param defaultValue - Default numeric value (default: 0)
   * @returns The parsed number or the default
   *
   * @example
   * ```typescript
   * Env.getNumber('PORT', 3000);       // 3000 (if PORT not set)
   * Env.getNumber('MAX_RETRIES', 3);   // parsed value or 3
   * ```
   */
  public static getNumber(key: string, defaultValue: number = 0): number {
    const value = Env.resolve(key);
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get an environment variable as a boolean.
   *
   * Truthy values: 'true', '1', 'yes', 'on'
   * Everything else (including unset) returns the default.
   *
   * @param key - The environment variable name
   * @param defaultValue - Default boolean value (default: false)
   * @returns The parsed boolean or the default
   *
   * @example
   * ```typescript
   * Env.getBoolean('DEBUG', false);     // true if DEBUG=true|1|yes|on
   * Env.getBoolean('VERBOSE');          // false if not set
   * ```
   */
  public static getBoolean(key: string, defaultValue: boolean = false): boolean {
    const value = Env.resolve(key);
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }
    const truthy = ["true", "1", "yes", "on"];
    return truthy.includes(value.toLowerCase());
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Environment Detection
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Check if the current environment matches a given value.
   *
   * Compares against the `NODE_ENV` variable (case-insensitive).
   *
   * @param environment - The environment name to check against
   * @returns True if NODE_ENV matches
   *
   * @example
   * ```typescript
   * Env.is('production');  // true if NODE_ENV=production
   * Env.is('staging');     // true if NODE_ENV=staging
   * ```
   */
  public static is(environment: string): boolean {
    return Env.get("NODE_ENV", "development").toLowerCase() === environment.toLowerCase();
  }

  /**
   * Check if the current environment is production.
   *
   * @returns True if NODE_ENV is 'production'
   *
   * @example
   * ```typescript
   * if (Env.isProduction()) {
   *   enablePerformanceMonitoring();
   * }
   * ```
   */
  public static isProduction(): boolean {
    return Env.is("production");
  }

  /**
   * Check if the current environment is development.
   *
   * @returns True if NODE_ENV is 'development'
   *
   * @example
   * ```typescript
   * if (Env.isDevelopment()) {
   *   enableHotReloading();
   * }
   * ```
   */
  public static isDevelopment(): boolean {
    return Env.is("development");
  }

  /**
   * Check if the current environment is test.
   *
   * @returns True if NODE_ENV is 'test'
   *
   * @example
   * ```typescript
   * if (Env.isTest()) {
   *   useMockServices();
   * }
   * ```
   */
  public static isTest(): boolean {
    return Env.is("test");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Resolve an environment variable from the available sources.
   *
   * Checks in order:
   * 1. `process.env` (Node.js)
   * 2. `import.meta.env` (Vite)
   * 3. `globalThis.__ENV__` (injected at build time)
   *
   * @param key - The variable name
   * @returns The value or undefined
   */
  private static resolve(key: string): string | undefined {
    // Node.js environment
    if (typeof process !== "undefined" && process.env) {
      const value = process.env[key];
      if (value !== undefined) return value;
    }

    // Vite / import.meta.env (available at build time in browser/bundler context)
    try {
      // Use indirect eval to avoid Node detecting import.meta as a static ESM marker
      const getMeta = new Function(
        'return typeof import.meta !== "undefined" ? import.meta : undefined',
      );
      const meta = getMeta() as Record<string, unknown> | undefined;
      if (meta && meta.env && typeof meta.env === "object") {
        const env = meta.env as Record<string, string>;
        const value = env[key];
        if (value !== undefined) return value;
      }
    } catch {
      // import.meta not available in CJS/Node contexts
    }

    // Global __ENV__ object (build-time injection)
    if (typeof globalThis !== "undefined") {
      const globalEnv = (globalThis as unknown as Record<string, unknown>).__ENV__;
      if (globalEnv && typeof globalEnv === "object") {
        const value = (globalEnv as Record<string, string>)[key];
        if (value !== undefined) return value;
      }
    }

    return undefined;
  }
}
