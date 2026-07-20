/**
 * @file container-logger-options.interface.ts
 * @module @stackra/container/src/interfaces
 * @description Configuration options for the container bootstrap logger.
 */

/**
 * Configuration for the container logger.
 */
export interface IContainerLoggerOptions {
  /** Enable or disable logging. */
  enabled?: boolean;
  /** Log provider resolution details. */
  resolution?: boolean;
  /** Log lifecycle hook execution. */
  lifecycle?: boolean;
  /** Include timing information. */
  timing?: boolean;
  /** Render the full dependency graph. */
  graph?: boolean;
  /** Use ANSI colors in output. */
  colors?: boolean;
  /** Custom renderer for output (defaults to console.log). */
  renderer?: (output: string) => void;
}
