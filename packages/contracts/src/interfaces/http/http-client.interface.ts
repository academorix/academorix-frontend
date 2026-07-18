/**
 * @file http-client.interface.ts
 * @module @stackra/contracts/interfaces/http
 * @description The per-connection HTTP client contract + its config.
 */

import type { IHttpRequestConfig, IHttpResponse } from "./http-request.interface";
import type { IHttpStream, ISseConfig, ISseEvent, IStreamConfig } from "./http-stream.interface";
import type {
  IHttpCircuitBreakerConfig,
  IHttpRateLimitEndpointConfig,
} from "./http-resilience.interface";

/**
 * Effective configuration for a single connection.
 */
export interface IHttpClientConfig {
  /** Base URL for the connection. */
  baseURL?: string;
  /** API prefix segment folded into the base URL. */
  apiPrefix?: string;
  /** API version segment folded into the base URL. */
  version?: string;
  /** Default per-request timeout (ms). */
  timeout?: number;
  /** Default headers applied to every request. */
  headers?: Record<string, string>;
  /** Connector driver name (defaults to `'axios'`). */
  driver?: string;

  /** Circuit-breaker configuration. */
  circuitBreaker?: IHttpCircuitBreakerConfig;

  /** Rate-limit configuration. */
  rateLimit?: {
    enabled?: boolean;
    default?: IHttpRateLimitEndpointConfig;
    endpoints?: Record<string, IHttpRateLimitEndpointConfig>;
  };

  /** In-flight request de-duplication. */
  deduplication?: {
    enabled?: boolean;
    keyGenerator?: (request: IHttpRequestConfig) => string;
  };

  /** Upload/download progress emission. */
  progress?: {
    enabled?: boolean;
    /** Minimum interval between progress callbacks (ms). */
    throttle?: number;
  };

  /** Response caching. */
  cache?: {
    enabled?: boolean;
    /** Fallback TTL (ms) when the server sends no cache directives. */
    ttl?: number;
    /** Honour `Cache-Control` / `ETag` headers. */
    respectCacheControl?: boolean;
    /** URL patterns excluded from caching. */
    excludePatterns?: RegExp[];
  };

  /** Request/response transformation. */
  transform?: {
    enabled?: boolean;
    requestTransform?: boolean;
    responseTransform?: boolean;
    caseConversion?: { request?: "snake_case"; response?: "camelCase" };
    dateHandling?: { serializeDates?: boolean; parseDates?: boolean };
    customTransforms?: Record<
      string,
      {
        request?: (value: unknown) => unknown;
        response?: (value: unknown) => unknown;
      }
    >;
  };

  /** Metrics collection. */
  metrics?: {
    enabled?: boolean;
    /** Sampling rate, 0..1. */
    sampleRate?: number;
    sentry?: { enabled?: boolean };
  };
}

/**
 * A per-connection HTTP client.
 *
 * Unary methods run the full middleware → interceptor → connector
 * pipeline; streaming methods run the same middleware chain, then open
 * the connector stream and yield decoded values.
 */
export interface IHttpClient {
  /** Perform a GET request. */
  get<T = unknown>(url: string, config?: IHttpRequestConfig): Promise<IHttpResponse<T>>;
  /** Perform a POST request. */
  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: IHttpRequestConfig,
  ): Promise<IHttpResponse<T>>;
  /** Perform a PUT request. */
  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: IHttpRequestConfig,
  ): Promise<IHttpResponse<T>>;
  /** Perform a PATCH request. */
  patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: IHttpRequestConfig,
  ): Promise<IHttpResponse<T>>;
  /** Perform a DELETE request. */
  delete<T = unknown>(url: string, config?: IHttpRequestConfig): Promise<IHttpResponse<T>>;
  /** Perform an arbitrary request. */
  request<T = unknown>(config: IHttpRequestConfig): Promise<IHttpResponse<T>>;
  /** Open a decoded stream (SSE/NDJSON/JSON/text/binary). */
  stream<T = unknown>(url: string, config?: IStreamConfig): IHttpStream<T>;
  /** Open a Server-Sent Events stream. */
  sse<T = unknown>(url: string, config?: ISseConfig): IHttpStream<ISseEvent<T>>;
}
