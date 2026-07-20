/**
 * @file global-middleware.decorator.ts
 * @module @stackra/decorators/routing
 *
 * @description
 * `@GlobalMiddleware(...)` — thin sugar over
 * `@Middleware({ ..., global: true })`. Accepts either an options
 * object or a name-only shortcut.
 */

import type { IMiddlewareOptions } from "@stackra/contracts";

import { Middleware } from "./middleware.decorator";

/**
 * Mark a class as a globally-registered routing middleware.
 *
 * Equivalent to `@Middleware({...options, global: true})`. Accepts a
 * full options object OR a name-only shortcut string.
 *
 * @param options - Middleware descriptor or middleware name.
 * @returns A `ClassDecorator` that stamps `global: true`.
 *
 * @example
 * ```typescript
 * // Options form:
 * @GlobalMiddleware({ name: 'audit', priority: 100 })
 * export class AuditMiddleware implements IMiddleware { ... }
 *
 * // Name-only form:
 * @GlobalMiddleware('audit')
 * export class AuditMiddleware implements IMiddleware { ... }
 * ```
 */
export function GlobalMiddleware(options: Partial<IMiddlewareOptions> | string): ClassDecorator {
  const descriptor: IMiddlewareOptions =
    typeof options === "string"
      ? { name: options, global: true }
      : { ...options, name: options.name ?? "anonymous-middleware", global: true };

  return Middleware(descriptor);
}
