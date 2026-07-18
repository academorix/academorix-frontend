/**
 * @file run-middleware.util.ts
 * @module @stackra/routing/testing
 * @description Invoke a middleware's `handle(...)` in isolation.
 *
 *   Given a middleware instance + a context, calls `handle(ctx, next)`
 *   with a controllable `next` callback and returns the result.
 */

import type {
  IApplication,
  IMatchDescriptor,
  IMiddleware,
  IMiddlewareContext,
  IMiddlewareNext,
} from "@stackra/contracts";

import { createMockContainer } from "./create-mock-container.util";

/**
 * Overridable fields for the middleware context.
 */
export interface IRunMiddlewareOptions {
  readonly url?: URL | string;
  readonly params?: Readonly<Record<string, string>>;
  readonly matches?: readonly IMatchDescriptor[];
  readonly container?: IApplication;
  readonly state?: Record<string, unknown>;
  readonly headers?: Headers | Record<string, string>;
  /**
   * The value `next()` should resolve to. Defaults to `undefined`.
   * Pass a factory to compute per-call (e.g. record calls).
   */
  readonly nextResult?: unknown | (() => unknown | Promise<unknown>);
}

/**
 * Invoke a middleware's `handle(...)` in isolation.
 *
 * @param middleware - Middleware INSTANCE (already constructed).
 * @param options    - Optional context overrides + `next` behaviour.
 * @returns The middleware's return value.
 *
 * @example
 * ```typescript
 * const result = await runMiddleware(new AuditMiddleware(logger), {
 *   nextResult: () => 'inner-value',
 * });
 * expect(result).toBe('inner-value');
 * ```
 */
export async function runMiddleware(
  middleware: IMiddleware,
  options: IRunMiddlewareOptions = {},
): Promise<unknown> {
  const urlSource = options.url ?? "http://localhost/";
  // Relative paths resolve against `http://localhost/` so tests can
  // pass `url: '/dashboard'` directly.
  const url = urlSource instanceof URL ? urlSource : new URL(urlSource, "http://localhost/");

  const headers =
    options.headers instanceof Headers ? options.headers : new Headers(options.headers ?? {});

  const request = new Request(url.toString(), { headers });
  const container = options.container ?? createMockContainer();

  const ctx: IMiddlewareContext = {
    request,
    url,
    params: options.params ?? {},
    matches: options.matches ?? [],
    container,
    state: options.state ?? {},
  };

  // Build the `next` callback — either a static value or a factory.
  const next: IMiddlewareNext = async () => {
    const source = options.nextResult;
    if (typeof source === "function") {
      return await (source as () => unknown | Promise<unknown>)();
    }
    return source;
  };

  return await middleware.handle(ctx, next);
}
