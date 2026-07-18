/**
 * @file tap.ts
 * @module @stackra/support
 * @description Tap helper — execute a callback on a value and return the value unchanged.
 *   Inspired by Laravel's `tap()` helper. Useful for performing side effects
 *   within a method chain without breaking the flow.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Call a callback with the given value, then return the value.
 *
 * This is useful for performing side effects (logging, assertions, mutations)
 * on a value without interrupting a fluent chain or pipeline.
 *
 * @typeParam T - The type of the value
 * @param value - The value to pass to the callback
 * @param callback - A function that receives the value (return value is ignored)
 * @returns The original value, unchanged
 *
 * @example
 * ```typescript
 * import { tap } from '@stackra/support';
 *
 * // Logging within a chain
 * const user = tap(createUser(data), (u) => {
 *   logger.info('Created user:', u.id);
 * });
 *
 * // Mutating an object in-flight
 * const config = tap({ host: 'localhost', port: 3000 }, (cfg) => {
 *   cfg.port = 8080;
 * });
 * // config.port === 8080
 * ```
 */
export function tap<T>(value: T, callback: (value: T) => void): T {
  callback(value);
  return value;
}
