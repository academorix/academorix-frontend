/**
 * @file progress-options.interface.ts
 * @module @stackra/contracts/interfaces/console
 * @description Options bag for `IConsoleOutput#progress(...)` — creates a
 *   progress bar bound to a known total.
 */

/**
 * Options accepted when constructing a progress bar.
 */
export interface IProgressOptions {
  /** Total number of steps the operation will take. */
  readonly total: number;

  /** Optional label rendered next to the bar. */
  readonly message?: string;
}
