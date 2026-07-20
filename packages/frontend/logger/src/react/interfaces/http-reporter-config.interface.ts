/**
 * @file http-reporter-config.interface.ts
 * @module @stackra/logger/react/interfaces
 * @description Configuration interface for the HTTP reporter.
 */

/**
 * Configuration for the HTTP reporter.
 *
 * Controls how log entries are batched and shipped to a remote
 * logging endpoint from browser/React Native environments.
 */
export interface IHttpReporterConfig {
  /** Remote endpoint URL to POST batches to. */
  endpoint: string;
  /** Number of entries to batch before sending. Default: 10. */
  batchSize?: number;
  /** Flush interval in milliseconds. Default: 5000. */
  flushIntervalMs?: number;
  /** Extra headers to include on each request. */
  headers?: Record<string, string>;
}
