/**
 * @file benchmark.ts
 * @module @stackra/support
 * @description Performance measurement utilities.
 *   Provides static methods for measuring execution time of functions
 *   and comparing multiple implementations against each other.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Benchmark Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Performance measurement utility class.
 *
 * Provides static methods for timing function execution and comparing
 * performance of multiple implementations. Uses `performance.now()` for
 * high-resolution timing when available.
 *
 * @example
 * ```typescript
 * import { Benchmark } from '@stackra/support';
 *
 * // Measure a single function
 * const ms = await Benchmark.measure(() => expensiveComputation());
 * logger.info(`Took ${ms}ms`);
 *
 * // Compare implementations
 * const results = await Benchmark.compare({
 *   'Array.push': () => { const a = []; for (let i = 0; i < 1000; i++) a.push(i); },
 *   'Array spread': () => { let a: number[] = []; for (let i = 0; i < 1000; i++) a = [...a, i]; },
 * }, 100);
 * // { 'Array.push': 1.5, 'Array spread': 45.2 }
 * ```
 */
export class Benchmark {
  // ══════════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Measure the execution time of a function in milliseconds.
   *
   * Supports both synchronous and asynchronous functions. If the function
   * returns a Promise, the measurement includes the time until resolution.
   *
   * @param fn - The function to measure
   * @returns The execution time in milliseconds
   *
   * @example
   * ```typescript
   * const ms = await Benchmark.measure(() => {
   *   // Some computation
   *   return fibonacci(40);
   * });
   * logger.info(`Fibonacci(40) took ${ms}ms`);
   *
   * // Async function
   * const asyncMs = await Benchmark.measure(async () => {
   *   await fetch('/api/data');
   * });
   * ```
   */
  public static async measure(fn: () => unknown): Promise<number> {
    const start = Benchmark.now();
    const result = fn();

    // If the function returned a promise, await it
    if (result instanceof Promise) {
      await result;
    }

    const end = Benchmark.now();
    return end - start;
  }

  /**
   * Compare execution times of multiple named functions.
   *
   * Runs each function the specified number of iterations and returns
   * the average execution time in milliseconds for each.
   *
   * @param fns - Object mapping names to functions to benchmark
   * @param iterations - Number of times to run each function (default: 1)
   * @returns Object mapping names to average execution times in ms
   *
   * @example
   * ```typescript
   * const results = await Benchmark.compare({
   *   'for loop': () => { for (let i = 0; i < 10000; i++) {} },
   *   'while loop': () => { let i = 0; while (i < 10000) i++; },
   *   'forEach': () => { Array.from({ length: 10000 }).forEach(() => {}); },
   * }, 1000);
   *
   * // results: { 'for loop': 0.012, 'while loop': 0.011, 'forEach': 0.045 }
   * ```
   */
  public static async compare(
    fns: Record<string, () => unknown>,
    iterations: number = 1,
  ): Promise<Record<string, number>> {
    const results: Record<string, number> = {};

    for (const [name, fn] of Object.entries(fns)) {
      let totalMs = 0;

      for (let i = 0; i < iterations; i++) {
        const elapsed = await Benchmark.measure(fn);
        totalMs += elapsed;
      }

      results[name] = totalMs / iterations;
    }

    return results;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get the current high-resolution timestamp in milliseconds.
   *
   * Uses `performance.now()` when available for sub-millisecond precision.
   * Falls back to `Date.now()` in environments without the Performance API.
   *
   * @returns Current timestamp in milliseconds
   */
  private static now(): number {
    if (typeof performance !== "undefined" && performance.now) {
      return performance.now();
    }
    return Date.now();
  }
}
