/**
 * @file retry-options.interface.ts
 * @module @stackra/support/interfaces
 * @description Configuration options for the retry utility.
 */

/** Configuration for the retry utility. */
export interface IRetryOptions {
  /** Maximum number of attempts (default: 3). */
  times?: number;

  /**
   * Delay between attempts.
   *
   * - `number` — base delay in ms, combined with `backoff` (linear or
   *   exponential) to produce the wait for each attempt.
   * - `number[]` — explicit per-attempt delay array. `delay[n]` is the
   *   wait between attempt `n` and `n+1`; the last entry is reused when
   *   the array is shorter than `times - 1`. When an array is supplied,
   *   the `backoff` option is ignored.
   *
   * @default 100
   */
  delay?: number | readonly number[];

  /**
   * Backoff strategy for the scalar `delay` form (`'linear'` multiplies
   * `delay * attempt`; `'exponential'` multiplies `delay * 2^(attempt - 1)`).
   * Ignored when `delay` is an array.
   *
   * @default 'linear'
   */
  backoff?: "linear" | "exponential";

  /** Only retry if predicate returns true for the error. */
  when?: (error: Error) => boolean;

  /**
   * Optional hook fired BEFORE each retry wait — receives the
   * upcoming attempt number (1-indexed), the delay in ms, and the
   * error from the previous attempt. Useful for lifecycle events
   * (telemetry, retry counters).
   */
  onRetry?: (attempt: number, delayMs: number, error: Error) => void;
}
