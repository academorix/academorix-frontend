/**
 * @file once.ts
 * @module @stackra/support
 * @description Memoize a function so it only executes once.
 *   Subsequent calls return the cached result from the first execution.
 *   Useful for expensive initialization that should happen lazily.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Create a function that executes its callback only on the first invocation.
 *
 * The return value from the first call is cached and returned on all
 * subsequent calls. The original function is never called again.
 *
 * @typeParam T - The return type of the function
 * @param fn - The function to execute once
 * @returns A wrapper function that caches the first result
 *
 * @example
 * ```typescript
 * import { once } from '@stackra/support';
 *
 * let counter = 0;
 * const initialize = once(() => {
 *   counter++;
 *   return { connectionId: 'abc-123' };
 * });
 *
 * initialize(); // { connectionId: 'abc-123' } — counter is 1
 * initialize(); // { connectionId: 'abc-123' } — counter is still 1
 * initialize(); // { connectionId: 'abc-123' } — counter is still 1
 * ```
 */
export function once<T>(fn: () => T): () => T {
  let called = false;
  let result: T;

  return (): T => {
    if (!called) {
      result = fn();
      called = true;
    }
    return result;
  };
}
