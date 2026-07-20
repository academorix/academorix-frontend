/**
 * @file log.middleware.ts
 * @module @stackra/actions/core/pipeline
 * @description Log middleware — records `kind`, elapsed ms, and success
 *   flag for every dispatched action.
 */

import { Inject, Injectable, Optional } from '@stackra/container';
import type { ILoggerManager } from '@stackra/contracts';
import { LOGGER_MANAGER } from '@stackra/contracts';

import type { IMiddlewarePassable } from './middleware-passable.interface';

/**
 * Log middleware — one debug line per dispatched action.
 */
@Injectable()
export class LogMiddleware {
  public constructor(
    @Optional() @Inject(LOGGER_MANAGER) private readonly logger?: ILoggerManager
  ) {}

  public async handle(
    passable: IMiddlewarePassable,
    next: (p: IMiddlewarePassable) => Promise<IMiddlewarePassable>
  ): Promise<IMiddlewarePassable> {
    const start = Date.now();
    const result = await next(passable);
    const elapsedMs = Date.now() - start;
    const kind = result.descriptor.kind;
    const success = result.response?.success ?? false;
    this.logger
      ?.channel('actions', 'log')
      .debug(`[actions] dispatched kind="${kind}" elapsedMs=${elapsedMs} success=${success}`);
    return result;
  }
}
