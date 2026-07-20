/**
 * @file config-env-missing.error.ts
 * @module @stackra/config/core/errors
 * @description Error thrown by `env.orFail(key)` when the requested
 *   environment variable is unset across every source.
 */

import { ConfigError } from "./config.error";

/**
 * Thrown by `env.orFail(key)` when the variable is unset.
 *
 * The error message names the key so debuggers see WHICH variable
 * caused the failure without chasing stack frames.
 *
 * @example
 * ```typescript
 * try {
 *   env.orFail('JWT_SECRET');
 * } catch (err) {
 *   if (err instanceof ConfigEnvMissingError) {
 *     process.exit(1); // pre-flight check failed
 *   }
 * }
 * ```
 */
export class ConfigEnvMissingError extends ConfigError {
  /**
   * @param key - Environment variable name that was missing.
   */
  public constructor(key: string) {
    super(`Environment variable [${key}] is not set.`, "CONFIG_ENV_MISSING");
  }
}
