/**
 * @file http-request.interface.ts
 * @module @stackra/contracts/interfaces/http
 * @description Core request/response/context shapes flowing through the
 *   HTTP client pipeline.
 */

import type { HttpMethod } from "@/enums/http-method.enum";

/**
 * Per-request configuration.
 *
 * Merged on top of the connection defaults by the client, then carried
 * through middleware → interceptors → connector.
 */
export interface IHttpRequestConfig {
  /** Request path or absolute URL. */
  url?: string;
  /**
   * HTTP verb. Accepts `HttpMethod` members and raw string literals
   * (`'GET'`, `'post'`, …) — the connectors normalise case.
   */
  method?: HttpMethod | (string & {});
  /** Request body for `post`/`put`/`patch`. */
  data?: unknown;
  /** Request headers (merged connection + per-request, mutated by middleware). */
  headers?: Record<string, string>;
  /** Query params. Arrays expand to repeated keys. */
  params?: Record<string, unknown>;
  /** Per-request timeout in milliseconds. */
  timeout?: number;
  /** External cancellation signal. */
  signal?: AbortSignal;
  /** Expected response body decoding. */
  responseType?: "json" | "text" | "blob" | "arraybuffer" | "stream";
  /** Effective base URL (set by the client from connection config). */
  baseURL?: string;
  /** API prefix segment folded into the base URL. */
  apiPrefix?: string;
  /** API version segment folded into the base URL. */
  version?: string;
  /**
   * Per-request flags and overrides read by middleware/interceptors.
   *
   * Recognised keys include: `skipAuth`, `skipCircuitBreaker`,
   * `skipDeduplication`, `skipLocale`, `skipTenant`, `skipRateLimit`,
   * `skipCache`, `skipTransform`, `cacheTags` (`string[]`),
   * `maxRetries` (`number`), `retryBackoff` (`number[]`),
   * `isUpload` (`boolean`).
   */
  meta?: Record<string, unknown>;
  /** Low-level upload progress hook forwarded to the driver. */
  onUploadProgress?: (event: unknown) => void;
  /** Low-level download progress hook forwarded to the driver. */
  onDownloadProgress?: (event: unknown) => void;
}

/**
 * Normalised HTTP response returned by every connector.
 *
 * @typeParam T - Decoded response body type.
 */
export interface IHttpResponse<T = unknown> {
  /** Decoded response body. */
  data: T;
  /** HTTP status code. */
  status: number;
  /** HTTP status text. */
  statusText: string;
  /** Response headers (lower-cased keys). */
  headers: Record<string, string>;
  /** The request config that produced this response (omitted for synthetic responses). */
  config?: IHttpRequestConfig;
}

/**
 * Mutable context threaded through the middleware/interceptor pipeline.
 */
export interface IHttpContext {
  /** The (mutable) request configuration. */
  request: IHttpRequestConfig;
  /** Free-form per-request scratch space shared across stages. */
  metadata: Map<string, unknown>;
}
