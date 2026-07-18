/**
 * @file retry.ts
 * @module @stackra/support
 * @description Retry an async operation with configurable backoff.
 *
 *   Supports linear, exponential, and array-based per-attempt
 *   backoff; conditional retry via a `when` predicate; and an
 *   `onRetry` hook that fires before every wait (useful for
 *   telemetry).
 */

import { sleep } from "./sleep.util";
import type { IRetryOptions } from "../interfaces";

// ============================================================================
// Implementation
// ============================================================================

/**
 * Compute the wait between attempt `n` and `n+1`.
 *
 * @param attempt - The attempt number that just failed (1-indexed).
 * @param delay - Scalar base delay or per-attempt array.
 * @param backoff - Strategy for the scalar form.
 * @returns Delay in milliseconds.
 */
function computeDelay(
  attempt: number,
  delay: number | readonly number[],
  backoff: "linear" | "exponential",
): number {
  if (Array.isArray(delay)) {
    // `attempt` is 1-indexed after the first failure. The array is
    // 0-indexed — index 0 is the wait before attempt 2, etc.
    const idx = attempt - 1;
    return (delay[idx] ?? delay[delay.length - 1] ?? 0) as number;
  }
  const base = delay as number;
  return backoff === "exponential" ? base * Math.pow(2, attempt - 1) : base * attempt;
}

/**
 * Retry an async function with configurable backoff.
 *
 * Executes `fn` up to `options.times` attempts. On failure, waits
 * according to the backoff strategy before retrying. If `options.when`
 * is provided, only retries when the predicate returns `true` for the
 * error — otherwise the error is thrown immediately.
 *
 * @typeParam T - The return type of `fn`.
 * @param fn - The async function to execute.
 * @param options - Retry configuration.
 * @returns The result of the first successful attempt.
 * @throws The last error when every attempt fails, or the first error
 *   when a `when` predicate returned `false`.
 *
 * @example
 * ```typescript
 * import { retry } from '@stackra/support';
 *
 * // Basic — 3 attempts, 100ms linear backoff.
 * const data = await retry(() => fetchData('/api/users'));
 *
 * // Exponential backoff, only retry on timeouts.
 * const result = await retry(() => unstableApi.call(), {
 *   times: 5,
 *   delay: 200,
 *   backoff: 'exponential',
 *   when: (err) => err.message.includes('timeout'),
 * });
 *
 * // Explicit per-attempt delays + telemetry hook.
 * const data = await retry(() => client.get('/api'), {
 *   times: 4,
 *   delay: [200, 500, 1000],
 *   onRetry: (attempt, delayMs, err) => logger.warn({ attempt, delayMs, err }),
 * });
 * ```
 */
export async function retry<T>(fn: () => Promise<T>, options?: IRetryOptions): Promise<T> {
  const times = options?.times ?? 3;
  const delay = options?.delay ?? 100;
  const backoff = options?.backoff ?? "linear";
  const when = options?.when;
  const onRetry = options?.onRetry;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= times; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // A `when` predicate short-circuits the retry loop: if the caller
      // decided this error isn't retryable, propagate immediately.
      if (when && !when(lastError)) {
        throw lastError;
      }

      // Don't wait after the last attempt — the throw below fires next.
      if (attempt < times) {
        const delayMs = computeDelay(attempt, delay, backoff);
        if (onRetry) {
          // Fire-and-forget lifecycle hook — swallow errors so
          // telemetry issues never affect retry behaviour.
          try {
            onRetry(attempt + 1, delayMs, lastError);
          } catch {
            /* swallow */
          }
        }
        await sleep(delayMs);
      }
    }
  }

  // Every attempt threw; `lastError` is guaranteed defined at this point
  // because the `for` loop ran at least once (times >= 1).
  throw lastError as Error;
}
