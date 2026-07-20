/**
 * @file spinner.interface.ts
 * @module @stackra/contracts/interfaces/console
 * @description Handle returned by `IConsoleOutput#spinner()` — an animated
 *   indicator for long-running operations. Framework-agnostic: `start`
 *   swaps a running message, `stop` freezes the final state.
 */

/**
 * A spinner handle. Call `start(msg)` to begin the animation, then
 * `stop(msg?, exitCode?)` to freeze it. The optional `exitCode` lets
 * the consumer signal whether the run succeeded (0) or failed (non-0)
 * so the concrete renderer can pick the right closing glyph.
 */
export interface ISpinner {
  /** Begin the spinner animation with the given message. */
  start(message: string): void;

  /**
   * Freeze the spinner with an optional final message and exit code.
   *
   * @param message - Final line to render in place of the animation.
   * @param exitCode - `0` for success (default), non-zero for failure.
   */
  stop(message?: string, exitCode?: number): void;
}
