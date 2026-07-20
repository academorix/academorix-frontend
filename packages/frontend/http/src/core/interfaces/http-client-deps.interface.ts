/**
 * @file http-client-deps.interface.ts
 * @module @stackra/http/src/interfaces
 * @description IHttpClientDeps interface.
 */

import type {
  IEventEmitter,
  IHttpClientConfig,
  IHttpConnector,
  IHttpInterceptorRegistry,
  IHttpMiddlewareRegistry,
} from "@stackra/contracts";

/**
 * Pre-bound dependencies handed to the client by the manager.
 */
export interface IHttpClientDeps {
  /** Connection name surfaced in event payloads. */
  name: string;
  /** Resolved connection configuration. */
  config: IHttpClientConfig;
  /** Connector resolved from the driver registry. */
  connector: IHttpConnector;
  /** Per-connection middleware registry. */
  middlewareRegistry: IHttpMiddlewareRegistry;
  /** Per-connection interceptor registry. */
  interceptorRegistry: IHttpInterceptorRegistry;
  /** Optional event emitter for lifecycle events. */
  eventEmitter?: IEventEmitter;
}
