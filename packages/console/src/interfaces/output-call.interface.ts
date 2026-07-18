/**
 * @file output-call.interface.ts
 * @module @stackra/console/interfaces
 * @description Shape of a single recorded call captured by `TestConsoleOutput` —
 *   the test-time double that records every `IConsoleOutput` invocation instead
 *   of writing to stdout. Test-only; not part of the CLI runtime contract.
 */

/**
 * A single recorded call to a `TestConsoleOutput` method.
 */
export interface IOutputCall {
  /** The method that was invoked (e.g. `"info"`, `"select"`). */
  readonly method: string;

  /** The arguments the caller passed. */
  readonly args: unknown[];

  /** Wall-clock timestamp when the call was recorded. */
  readonly timestamp: Date;
}
