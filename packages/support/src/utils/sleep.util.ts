/**
 * @file sleep.ts
 * @module @stackra/support
 * @description Promise-based delay utility.
 *   Returns a promise that resolves after the specified number of milliseconds.
 *   Useful for throttling, polling intervals, and test utilities.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Pause execution for a given number of milliseconds.
 *
 * Returns a promise that resolves after the specified delay. This is the
 * async equivalent of `setTimeout` — useful in loops, retry logic, and tests.
 *
 * @param ms - The number of milliseconds to sleep
 * @returns A promise that resolves after the delay
 *
 * @example
 * ```typescript
 * import { sleep } from '@stackra/support';
 *
 * async function poll() {
 *   while (true) {
 *     const data = await fetchData();
 *     if (data.ready) break;
 *     await sleep(1000); // Wait 1 second before next poll
 *   }
 * }
 *
 * // In tests
 * await sleep(100); // Wait for debounce to settle
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
