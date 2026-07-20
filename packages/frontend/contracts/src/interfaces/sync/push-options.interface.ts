/**
 * @file push-options.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Options passed to a push operation.
 */

/**
 * Options for a single-collection push.
 */
export interface IPushOptions {
  /** Base URL for the remote sync API. */
  baseUrl: string;

  /** Batch size — number of operations per request. */
  batchSize: number;

  /** Request timeout in milliseconds. */
  timeout: number;
}
