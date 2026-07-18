/**
 * @file timebox.ts
 * @module @stackra/support
 * @description Constant-time execution wrapper.
 *
 *   Ensures a function always takes at least a specified amount of
 *   time to complete, preventing timing-based side-channel attacks.
 *   Useful for authentication flows, password checks, and token
 *   comparisons where an early return could leak information.
 */

import { sleep } from "./sleep.util";

// ============================================================================
// Implementation
// ============================================================================

/**
 * Execute a function ensuring it always takes at least `microseconds`.
 *
 * Normalises execution time regardless of the code path taken inside
 * `fn`. If `fn` completes early, the remaining time is consumed as a
 * delay. If `fn` throws, the error is re-thrown — but only after the
 * minimum time has elapsed, so success and failure remain
 * indistinguishable to an observer.
 *
 * @typeParam T - The return type of `fn`.
 * @param fn - The async function to execute.
 * @param microseconds - Minimum execution time in microseconds (1000 μs = 1 ms).
 * @returns The result of `fn`.
 * @throws Re-throws any error from `fn` after the minimum time.
 *
 * @example
 * ```typescript
 * import { timebox } from '@stackra/support';
 *
 * // Password verification always takes at least 200ms.
 * const isValid = await timebox(
 *   () => verifyPassword(input, hash),
 *   200_000
 * );
 * ```
 */
export async function timebox<T>(fn: () => Promise<T>, microseconds: number): Promise<T> {
  const minimumMs = microseconds / 1000;
  const start = highResNow();

  let result: T | undefined;
  let error: unknown;
  let hasError = false;

  try {
    result = await fn();
  } catch (e: unknown) {
    error = e;
    hasError = true;
  }

  // Consume any remaining budget so success and failure indistinguishably
  // hit the minimum wall-clock time.
  const elapsed = highResNow() - start;
  const remaining = minimumMs - elapsed;
  if (remaining > 0) {
    await sleep(remaining);
  }

  if (hasError) {
    throw error;
  }

  // `result` is guaranteed defined at this point: either `fn` resolved
  // (assigning `result`) or it threw (returning above from `throw error`).
  return result as T;
}

// ============================================================================
// Private helpers
// ============================================================================

/**
 * High-resolution timestamp in milliseconds.
 *
 * Prefers `performance.now()` for its monotonicity + sub-ms precision
 * and falls back to `Date.now()` when unavailable (older Node without
 * the `perf_hooks` global, edge runtimes, etc.).
 */
function highResNow(): number {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
}
