/**
 * @file middleware.decorator.ts
 * @module @stackra/decorators/routing
 *
 * @description
 * The `@Middleware(options)` class decorator — marks a class as a
 * discoverable routing middleware. The discovery loader wires it into
 * the middleware chain of every route that references its `name` (or
 * a group that contains it).
 */

import { MIDDLEWARE_METADATA_KEY, type IMiddlewareOptions } from "@stackra/contracts";

import { createDiscoverableClassDecorator, createMetadataReader } from "../core";

/**
 * Mark a class as a discoverable routing middleware.
 *
 * @param options - Middleware descriptor (`name`, `priority`, `global`,
 *   `group`).
 * @returns A `ClassDecorator` that stamps the descriptor + auto-applies
 *   `@Injectable()`.
 *
 * @example
 * ```typescript
 * import { Middleware } from '@stackra/decorators/routing';
 * import type { IMiddleware, IMiddlewareContext, IMiddlewareNext } from '@stackra/contracts';
 *
 * @Middleware({ name: 'audit', priority: 100, group: '@web' })
 * export class AuditMiddleware implements IMiddleware {
 *   public async handle(ctx: IMiddlewareContext, next: IMiddlewareNext) {
 *     const start = performance.now();
 *     const result = await next();
 *     // ...
 *     return result;
 *   }
 * }
 * ```
 */
export const Middleware =
  createDiscoverableClassDecorator<IMiddlewareOptions>(MIDDLEWARE_METADATA_KEY);

/** Reader for `@Middleware(...)` metadata. */
export const middlewareMetadata = createMetadataReader<IMiddlewareOptions>(MIDDLEWARE_METADATA_KEY);
