/**
 * @file config-readonly.error.ts
 * @module @stackra/config/core/errors
 * @description Reserved error class for the v0.2 read-only source
 *   protection. Shipped now so v0.2 doesn't require a public API bump
 *   in the errors surface.
 */

import { ConfigError } from "./config.error";

/**
 * Reserved for v0.2 — thrown by `ConfigService.set(...)` when the
 * targeted source is marked read-only. v0.1 does not raise this
 * class; the constructor is exported to lock the API surface so
 * v0.2 can promote it without a semver bump on the error family.
 *
 * @example
 * ```typescript
 * // v0.2 only:
 * try { configService.set('remote.setting', 42); }
 * catch (err) {
 *   if (err instanceof ConfigReadonlyError) {
 *     // Remote config source rejected the mutation.
 *   }
 * }
 * ```
 */
export class ConfigReadonlyError extends ConfigError {
  /**
   * @param propertyPath - Dotted path the caller attempted to mutate.
   */
  public constructor(propertyPath: string) {
    super(
      `Configuration key "${propertyPath}" is read-only and cannot be mutated`,
      "CONFIG_READONLY",
    );
  }
}
