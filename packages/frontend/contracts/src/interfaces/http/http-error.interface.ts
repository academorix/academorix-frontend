/**
 * @file http-error.interface.ts
 * @module @stackra/contracts/interfaces/http
 * @description Normalised HTTP error shape produced by
 *   `ErrorNormalizerInterceptor` and consumed by retry/logging/metrics.
 */

import type { IHttpRequestConfig, IHttpResponse } from "./http-request.interface";

/**
 * Driver-agnostic normalised error.
 *
 * `statusCode` is `0` for network/timeout/abort failures.
 */
export interface IHttpError {
  /** Human-readable message. */
  message: string;
  /** HTTP status code, or `0` for transport-level failures. */
  statusCode: number;
  /** The request config that produced the error. */
  config?: IHttpRequestConfig;
  /** Discriminant marking an already-normalised error. */
  isHttpError: true;
  /** Field-level validation errors extracted from the response body. */
  errors?: Record<string, string[]>;
  /** The response, present for HTTP (non-network) failures. */
  response?: IHttpResponse;
}
