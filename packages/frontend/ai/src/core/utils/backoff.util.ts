/**
 * @file backoff.util.ts
 * @module @stackra/ai/core/utils
 * @description Bounded exponential-backoff computation used by the
 *   `ConnectionManager` to schedule reconnection attempts.
 */

/** The backoff-relevant slice of the retry policy. */
export interface IBackoffPolicy {
  /** Base backoff delay, in milliseconds. */
  baseMs: number;
  /** Maximum backoff delay cap, in milliseconds. */
  capMs: number;
}

/** Options controlling {@link computeBackoff}. */
export interface IBackoffOptions {
  /**
   * When `true`, apply full-jitter randomisation to the bounded delay.
   * Defaults to `false` so the result is pure and deterministic (the
   * non-decreasing + capped property holds).
   */
  jitter?: boolean;
  /** Random source (injectable for tests). Defaults to `Math.random`. */
  random?: () => number;
}

/**
 * Compute the reconnection delay for a zero-based attempt number.
 *
 * Returns a bounded exponential backoff: `min(capMs, baseMs * 2 ** attempt)`.
 * With jitter disabled (the default) the function is pure and deterministic,
 * producing a non-decreasing, capped sequence.
 *
 * @param attempt - Zero-based attempt index (clamped to `>= 0`).
 * @param policy - Backoff base and cap.
 * @param options - Optional jitter configuration.
 * @returns The delay, in milliseconds, in the range `[0, capMs]`.
 */
export function computeBackoff(
  attempt: number,
  policy: IBackoffPolicy,
  options: IBackoffOptions = {},
): number {
  const { baseMs, capMs } = policy;
  const safeAttempt = Number.isFinite(attempt) && attempt > 0 ? Math.floor(attempt) : 0;

  // 2 ** large-number overflows to Infinity; min() with capMs keeps it bounded.
  const exponential = baseMs * 2 ** safeAttempt;
  const bounded = Math.min(capMs, exponential);

  if (!options.jitter) {
    return bounded;
  }

  const random = options.random ?? Math.random;
  return random() * bounded;
}
