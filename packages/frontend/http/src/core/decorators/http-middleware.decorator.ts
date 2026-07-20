/**
 * `@HttpMiddleware()` class decorator.
 *
 * Marks a class as an HTTP middleware and stores priority/name
 * metadata for the manager / feature module to read at registration
 * time.
 *
 * Composes `@Injectable()` so consumers don't need both decorators.
 *
 * @module @stackra/http/decorators/http-middleware
 */

import { Injectable } from '@stackra/container';
import { defineMetadata, getMetadata } from '@vivtel/metadata';

import type { IHttpMiddlewareOptions } from '@stackra/contracts';

import { HTTP_MIDDLEWARE_METADATA } from '../constants';

/**
 * Decorator that marks a class as an HTTP middleware.
 *
 * @param options - Optional priority and name overrides.
 * @returns A class decorator.
 *
 * @example
 * ```typescript
 * @HttpMiddleware({ priority: 10, name: 'auth' })
 * export class AuthMiddleware implements IHttpMiddleware {
 *   public async handle(context, next) { ... }
 * }
 * ```
 */
export function HttpMiddleware(options: IHttpMiddlewareOptions = {}): ClassDecorator {
  return (target: Function) => {
    Injectable()(target as never);

    defineMetadata(
      HTTP_MIDDLEWARE_METADATA,
      {
        priority: options.priority ?? 50,
        name: options.name ?? target.name,
      },
      target as object
    );
  };
}

/**
 * Read `@HttpMiddleware()` metadata off a class.
 *
 * @param target - Class to inspect.
 * @returns Stored options, or `undefined` when undecorated.
 */
export function getHttpMiddlewareMetadata(target: Function): IHttpMiddlewareOptions | undefined {
  return getMetadata<IHttpMiddlewareOptions>(HTTP_MIDDLEWARE_METADATA, target as object);
}
