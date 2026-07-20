/**
 * @file network.error.ts
 * @module @stackra/sync/core/errors
 * @description Error thrown when a sync HTTP request fails.
 */

import { SyncError } from './sync.error';

/**
 * Network-layer error raised by the sync HTTP client.
 */
export class NetworkError extends SyncError {
  /** URL of the failed request, when available. */
  public readonly url?: string;

  /** HTTP status code, when the failure is a response. */
  public readonly statusCode?: number;

  public constructor(
    message: string,
    url?: string,
    statusCode?: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'NETWORK_ERROR', { ...context, url, statusCode });
    this.name = 'NetworkError';
    this.url = url;
    this.statusCode = statusCode;

    if (
      typeof (Error as unknown as { captureStackTrace?: unknown }).captureStackTrace === 'function'
    ) {
      (
        Error as unknown as { captureStackTrace: (target: object, ctor: Function) => void }
      ).captureStackTrace(this, NetworkError);
    }
  }
}
