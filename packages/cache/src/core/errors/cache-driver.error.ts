/**
 * @file cache-driver.error.ts
 * @module @stackra/cache/core/errors
 * @description Thrown when an unknown or unsupported cache driver is requested.
 *   This indicates a configuration error — the store name references a driver
 *   that is neither built-in nor registered via `extend()`.
 */

import { CacheError } from "./cache.error";

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Error thrown when an unknown cache driver is requested.
 *
 * @example
 * ```typescript
 * // This happens when config references a driver that doesn't exist:
 * // { stores: { redis: { driver: 'redis' } } }
 * // But no RedisStore is registered.
 * const store = manager.store('redis'); // throws CacheDriverError
 * ```
 */
export class CacheDriverError extends CacheError {
  /**
   * @param driverName - The name of the unsupported driver
   */
  public constructor(driverName: string) {
    super(
      `Cache driver "${driverName}" is not supported. Register it via ` +
        `cacheManager.extend('${driverName}', () => new YourStore()).`,
      "CACHE_DRIVER_NOT_FOUND",
    );
    this.name = "CacheDriverError";

    Object.setPrototypeOf(this, CacheDriverError.prototype);
  }
}
