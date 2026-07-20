/**
 * @file cache.error.ts
 * @module @stackra/cache/core/errors
 * @description Base error class for all cache-related errors.
 *   Provides a standard error code pattern for programmatic error handling
 *   without relying on message string matching.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Base error class for the cache package.
 *
 * All cache-specific errors extend this class, allowing consumers to
 * catch all cache errors with a single `instanceof CacheError` check.
 *
 * @example
 * ```typescript
 * try {
 *   await cache.remember('key', 300, factory);
 * } catch (error: Error | any) {
 *   if (error instanceof CacheError) {
 *     logger.info(`Cache error [${error.code}]: ${error.message}`);
 *   }
 * }
 * ```
 */
export class CacheError extends Error {
  /** Programmatic error code for switch/case handling. */
  public readonly code: string;

  /**
   * @param message - Human-readable error description
   * @param code - Machine-readable error code (default: 'CACHE_ERROR')
   */
  public constructor(message: string, code: string = "CACHE_ERROR") {
    super(message);
    this.name = "CacheError";
    this.code = code;

    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, CacheError.prototype);
  }
}
