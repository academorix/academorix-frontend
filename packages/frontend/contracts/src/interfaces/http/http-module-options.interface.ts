/**
 * @file http-module-options.interface.ts
 * @module @stackra/contracts/interfaces/http
 * @description Options accepted by `HttpModule.forRoot/forRootAsync/forFeatureMiddleware`.
 */

import type { Type } from "../type.interface";
import type { IHttpClientConfig } from "./http-client.interface";
import type { IHttpInterceptor, IHttpMiddleware } from "./http-middleware.interface";

/**
 * Static HTTP module configuration.
 */
export interface IHttpModuleOptions {
  /** Default connection name (must exist in `connections`). */
  default: string;
  /** Named connection configs (≥1 entry). */
  connections: Record<string, IHttpClientConfig>;
}

/**
 * Async HTTP module configuration.
 */
export interface IHttpModuleAsyncOptions {
  /** Factory producing the module options. */
  useFactory: (...args: unknown[]) => IHttpModuleOptions | Promise<IHttpModuleOptions>;
  /** Providers injected into `useFactory`. */
  inject?: unknown[];
  /** Modules to import for the factory's dependencies. */
  imports?: unknown[];
}

/**
 * A per-feature middleware registration entry.
 */
export interface IHttpFeatureMiddlewareEntry {
  /** Middleware class. */
  use: Type<IHttpMiddleware>;
  /** Target connection(s); defaults to the default connection. */
  connection?: string | string[];
  /** Execution priority (lower runs first). */
  priority?: number;
  /** Registration name (defaults to the class name). */
  name?: string;
}

/**
 * A per-feature interceptor registration entry.
 */
export interface IHttpFeatureInterceptorEntry {
  /** Interceptor class. */
  use: Type<IHttpInterceptor>;
  /** Target connection(s); defaults to the default connection. */
  connection?: string | string[];
  /** Execution priority (lower runs first). */
  priority?: number;
  /** Registration name (defaults to the class name). */
  name?: string;
}

/**
 * Feature-module options — register a custom driver and/or extra
 * connections and/or per-connection middleware / interceptors.
 *
 * A single `HttpModule.forFeature(options)` entry point handles every
 * combination; all fields are optional.
 */
export interface IHttpModuleFeatureOptions {
  /** Custom driver name to register (requires `connector`). */
  driver?: string;
  /** Connector class implementing `IHttpConnector` (registered under `driver`). */
  connector?: Type<unknown>;
  /** Additional connection configs. */
  connections?: Record<string, IHttpClientConfig>;
  /** Middleware to register against target connections. */
  middleware?: IHttpFeatureMiddlewareEntry[];
  /** Interceptors to register against target connections. */
  interceptors?: IHttpFeatureInterceptorEntry[];
}
