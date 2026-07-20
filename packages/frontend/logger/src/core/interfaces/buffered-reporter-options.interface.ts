/**
 * @file buffered-reporter-options.interface.ts
 * @module @stackra/logger/core/interfaces
 * @description Configuration interface for the buffered reporter wrapper.
 */

/**
 * Configuration options for the buffered reporter wrapper.
 *
 * Controls how log entries are batched before being flushed to
 * the underlying reporter.
 */
export interface IBufferedReporterOptions {
  /** Max entries before flushing. Default: 100. */
  bufferSize?: number;
  /** Flush interval in milliseconds. Default: 5000. */
  flushIntervalMs?: number;
}
