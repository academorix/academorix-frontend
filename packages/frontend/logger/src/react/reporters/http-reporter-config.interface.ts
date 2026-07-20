/**
 * @file http-reporter-config.interface.ts
 * @module @stackra/logger/src/interfaces
 * @description IHttpReporterConfig interface.
 */

/**
 * HTTP reporter configuration options.
 */
export interface IHttpReporterConfig {
  /** Remote endpoint URL to POST batched log entries to. */
  endpoint: string;

  /** Maximum number of entries to buffer before flushing. Default: 10. */
  batchSize?: number;

  /** Interval in milliseconds between automatic flushes. Default: 5000. */
  flushIntervalMs?: number;

  /** Additional headers to include in the POST request. */
  headers?: Record<string, string>;
}
