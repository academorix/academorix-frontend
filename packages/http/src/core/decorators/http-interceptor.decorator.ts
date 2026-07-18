/**
 * `@HttpInterceptor()` class decorator.
 *
 * Marks a class as an HTTP interceptor and stores priority/name
 * metadata. Composes `@Injectable()`.
 *
 * @module @stackra/http/decorators/http-interceptor
 */

import { Injectable } from '@stackra/container';
import { defineMetadata, getMetadata } from '@vivtel/metadata';

import type { IHttpInterceptorOptions } from '@stackra/contracts';

import { HTTP_INTERCEPTOR_METADATA } from '../constants';

/**
 * Mark a class as an HTTP interceptor.
 *
 * @param options - Optional priority and name overrides.
 * @returns A class decorator.
 *
 * @example
 * ```typescript
 * @HttpInterceptor({ priority: 90, name: 'logging' })
 * export class LoggingInterceptor implements IHttpInterceptor {
 *   public async intercept(context, next) { ... }
 * }
 * ```
 */
export function HttpInterceptor(options: IHttpInterceptorOptions = {}): ClassDecorator {
  return (target: Function) => {
    Injectable()(target as never);

    defineMetadata(
      HTTP_INTERCEPTOR_METADATA,
      {
        priority: options.priority ?? 50,
        name: options.name ?? target.name,
      },
      target as object
    );
  };
}

/**
 * Read `@HttpInterceptor()` metadata off a class.
 *
 * @param target - Class to inspect.
 * @returns Stored options, or `undefined` when undecorated.
 */
export function getHttpInterceptorMetadata(target: Function): IHttpInterceptorOptions | undefined {
  return getMetadata<IHttpInterceptorOptions>(HTTP_INTERCEPTOR_METADATA, target as object);
}
