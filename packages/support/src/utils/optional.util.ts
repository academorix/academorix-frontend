/**
 * @file optional.ts
 * @module @stackra/support
 * @description Safe nullable access via Proxy.
 *   Wraps a potentially null/undefined value in a Proxy that returns undefined
 *   for any property access instead of throwing a TypeError. Provides safe
 *   chaining for deeply nested optional values.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Wrap a nullable value in a safe-access Proxy.
 *
 * When the value is null or undefined, any property access on the returned
 * Proxy returns undefined instead of throwing. When the value exists, property
 * access works normally (delegates to the underlying object).
 *
 * This enables safe chaining without optional chaining operators in contexts
 * where the value shape is dynamic or unknown at compile time.
 *
 * @typeParam T - The type of the wrapped value
 * @param value - The value to wrap (may be null or undefined)
 * @returns The value itself if non-null, or a Proxy that returns undefined for any access
 *
 * @example
 * ```typescript
 * import { optional } from '@stackra/support';
 *
 * const user = getUserOrNull(); // User | null
 * const name = optional(user).name;      // string | undefined (no throw)
 * const city = optional(user).address?.city; // safe chaining
 *
 * // With a real value:
 * const real = optional({ name: 'Alice' });
 * real.name; // 'Alice'
 * ```
 */
export function optional<T extends object>(value: T | null | undefined): T {
  if (value !== null && value !== undefined) {
    return value;
  }

  // Return a Proxy that yields undefined for any property access
  return new Proxy({} as T, {
    /**
     * Intercept property access — always return undefined for null values.
     *
     * @param _target - The proxy target (empty object)
     * @param _prop - The property being accessed
     * @returns undefined
     */
    get(_target: T, _prop: string | symbol): undefined {
      return undefined;
    },
  });
}
