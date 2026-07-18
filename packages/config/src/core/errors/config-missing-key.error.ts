/**
 * @file config-missing-key.error.ts
 * @module @stackra/config/core/errors
 * @description Error thrown by `ConfigService.getOrThrow` when every
 *   configured source (loaded namespace, validated env, `process.env`)
 *   misses the requested property path.
 */

import { ConfigError } from "./config.error";

/**
 * Thrown by `ConfigService.getOrThrow(path)` when the path is unset
 * on every configured source.
 *
 * The stable `code` is `'CONFIG_MISSING_KEY'` — consumers pattern
 * against the code rather than the message.
 *
 * @example
 * ```typescript
 * try {
 *   configService.getOrThrow<number>('PORT');
 * } catch (err) {
 *   if (err instanceof ConfigMissingKeyError) {
 *     console.error(`Set PORT before booting.`);
 *   }
 * }
 * ```
 */
export class ConfigMissingKeyError extends ConfigError {
  /**
   * @param propertyPath - The dotted path that could not be resolved.
   */
  public constructor(propertyPath: string) {
    super(`Configuration key "${propertyPath}" does not exist`, "CONFIG_MISSING_KEY");
  }
}
