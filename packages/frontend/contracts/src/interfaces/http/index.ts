/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/http
 * @description Barrel export for HTTP interfaces.
 */

export type { IHttpRequestConfig, IHttpResponse, IHttpContext } from "./http-request.interface";
export type { IHttpConnector } from "./http-connector.interface";
export type { IHttpClient, IHttpClientConfig } from "./http-client.interface";
export type { IHttpManager } from "./http-manager.interface";
export type {
  IHttpNextFunction,
  IHttpMiddleware,
  IHttpInterceptor,
  IHttpMiddlewareEntry,
  IHttpInterceptorEntry,
  IHttpMiddlewareRegistry,
  IHttpInterceptorRegistry,
  IHttpMiddlewareOptions,
  IHttpInterceptorOptions,
} from "./http-middleware.interface";
export type {
  IHttpModuleOptions,
  IHttpModuleAsyncOptions,
  IHttpModuleFeatureOptions,
  IHttpFeatureMiddlewareEntry,
  IHttpFeatureInterceptorEntry,
} from "./http-module-options.interface";
export type { IHttpStream, IStreamConfig, ISseConfig, ISseEvent } from "./http-stream.interface";
export type {
  IHttpUploadOptions,
  IHttpChunkedUploadOptions,
  IHttpPresignedUrlResult,
  IHttpProgressCallback,
  IHttpProgressEvent,
  IHttpProgressListener,
} from "./http-upload.interface";
export type { ITokenProvider } from "./http-token-provider.interface";
export type {
  IHttpRequestRecord,
  IHttpEndpointMetrics,
  IHttpPercentiles,
  IHttpRealTimeStats,
  IHttpMetricsExporter,
} from "./http-metrics.interface";
export type {
  IHttpCircuitBreakerConfig,
  IHttpCircuitBreakerStats,
  IHttpRateLimitEndpointConfig,
} from "./http-resilience.interface";
export type { IHttpError } from "./http-error.interface";
