/**
 * @file progress-bar.interface.ts
 * @module @stackra/contracts/interfaces/console
 * @description Handle returned by `IConsoleOutput#progress(...)` — the caller
 *   `increment`s the bar as work completes and `finish`es it once done.
 */

/**
 * A progress bar handle.
 */
export interface IProgressBar {
  /**
   * Advance the bar by `step` units.
   *
   * @param step - Number of units to advance (defaults to 1).
   */
  increment(step?: number): void;

  /**
   * Complete the bar and optionally emit a summary line.
   *
   * @param message - Optional summary shown once the bar reaches 100%.
   */
  finish(message?: string): void;
}
