/**
 * @file config-env-invalid.error.ts
 * @module @stackra/config/core/errors
 * @description Error thrown by `env.enum(...)` / `env.url(...)` when
 *   the underlying environment variable fails coercion or membership.
 */

import { ConfigError } from "./config.error";

/**
 * Thrown by `env.enum(...)` when the raw value is outside the allowed
 * list, and by `env.url(...)` when the raw value does not parse as
 * a valid URL.
 *
 * The error message includes the key name AND the reason, so callers
 * see both which variable was misconfigured and why.
 *
 * @example
 * ```typescript
 * try {
 *   env.enum('NODE_ENV', ['development', 'production', 'test']);
 * } catch (err) {
 *   if (err instanceof ConfigEnvInvalidError) {
 *     console.error(err.message);
 *   }
 * }
 * ```
 */
export class ConfigEnvInvalidError extends ConfigError {
  /**
   * @param key - Environment variable name.
   * @param reason - Human-readable reason (`must be one of: ...`,
   *   `must be a valid URL, got: ...`).
   */
  public constructor(key: string, reason: string) {
    super(`Environment variable [${key}] is invalid: ${reason}`, "CONFIG_ENV_INVALID");
  }
}
