/**
 * @file http-middleware.interface.ts
 * @module @stackra/contracts/interfaces/http
 * @description Middleware / interceptor contracts, their registry
 *   surfaces, and decorator option shapes.
 *
 *   Middleware run before the request is handed to the connector;
 *   interceptors wrap the connector call. Both share the same
 *   `(context, next)` signature — the distinction is ordering and
 *   intent, mirrored by two separate registries.
 */

import type { IHttpContext, IHttpResponse } from "./http-request.interface";

/** The next stage in a middleware/interceptor chain. */
export type IHttpNextFunction = (context: IHttpContext) => Promise<IHttpResponse>;

/** A pre-handler middleware. */
export interface IHttpMiddleware {
  /** Inspect/mutate the context, then call (or short-circuit) `next`. */
  handle(context: IHttpContext, next: IHttpNextFunction): Promise<IHttpResponse>;
}

/** A handler-wrapping interceptor. */
export interface IHttpInterceptor {
  /** Wrap the downstream call — retry, cache, transform, etc. */
  intercept(context: IHttpContext, next: IHttpNextFunction): Promise<IHttpResponse>;
}

/** A priority-tagged middleware entry. */
export interface IHttpMiddlewareEntry {
  /** Lower runs first. */
  priority: number;
  /** The middleware instance. */
  middleware: IHttpMiddleware;
}

/** A priority-tagged interceptor entry. */
export interface IHttpInterceptorEntry {
  /** Lower runs first. */
  priority: number;
  /** The interceptor instance. */
  interceptor: IHttpInterceptor;
}

/** Per-connection middleware registry. */
export interface IHttpMiddlewareRegistry {
  /** Register a middleware under a name at a priority. */
  registerWithPriority(name: string, middleware: IHttpMiddleware, priority: number): void;
  /** Register a middleware under a name (default priority). */
  register(name: string, middleware: IHttpMiddleware): void;
  /** Get middleware sorted by ascending priority. */
  getSorted(): IHttpMiddleware[];
  /** Get the sorted priority-tagged entries. */
  getEntries(): IHttpMiddlewareEntry[];
  /** Remove every registration. */
  clear(): void;
}

/** Per-connection interceptor registry. */
export interface IHttpInterceptorRegistry {
  /** Register an interceptor under a name at a priority. */
  registerWithPriority(name: string, interceptor: IHttpInterceptor, priority: number): void;
  /** Register an interceptor under a name (default priority). */
  register(name: string, interceptor: IHttpInterceptor): void;
  /** Get interceptors sorted by ascending priority. */
  getSorted(): IHttpInterceptor[];
  /** Get the sorted priority-tagged entries. */
  getEntries(): IHttpInterceptorEntry[];
  /** Remove every registration. */
  clear(): void;
}

/** Options for the `@HttpMiddleware()` decorator. */
export interface IHttpMiddlewareOptions {
  /** Execution priority (lower runs first). */
  priority?: number;
  /** Registration name (defaults to the class name). */
  name?: string;
}

/** Options for the `@HttpInterceptor()` decorator. */
export interface IHttpInterceptorOptions {
  /** Execution priority (lower runs first). */
  priority?: number;
  /** Registration name (defaults to the class name). */
  name?: string;
}
