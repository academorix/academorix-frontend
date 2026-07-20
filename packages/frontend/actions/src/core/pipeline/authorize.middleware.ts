/**
 * @file authorize.middleware.ts
 * @module @stackra/actions/core/pipeline
 * @description Authorize middleware — checks a descriptor's optional
 *   `permission` against the configured {@link IPermissionResolver}
 *   and short-circuits the pipeline on denial.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import type { IEventEmitter, ILoggerManager, IPermissionResolver } from "@stackra/contracts";
import {
  ACTION_EVENTS,
  EVENT_EMITTER,
  LOGGER_MANAGER,
  PERMISSION_RESOLVER,
} from "@stackra/contracts";

import type { IMiddlewarePassable } from "./middleware-passable.interface";

/**
 * Authorize middleware.
 *
 * - Skips descriptors with `authorize: false` or no `permission`.
 * - Warns when a descriptor carries a `permission` but no resolver is
 *   configured (treats it as authorized).
 * - Emits `ACTION_EVENTS.AUTHORIZED` / `ACTION_EVENTS.DENIED`.
 * - Short-circuits the pipeline with a failed response on denial.
 */
@Injectable()
export class AuthorizeMiddleware {
  public constructor(
    @Optional() @Inject(PERMISSION_RESOLVER) private readonly resolver?: IPermissionResolver,
    @Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter,
    @Optional() @Inject(LOGGER_MANAGER) private readonly logger?: ILoggerManager,
  ) {}

  public async handle(
    passable: IMiddlewarePassable,
    next: (p: IMiddlewarePassable) => Promise<IMiddlewarePassable>,
  ): Promise<IMiddlewarePassable> {
    const { descriptor } = passable;
    if (descriptor.authorize === false || !descriptor.permission) {
      return next(passable);
    }

    if (!this.resolver) {
      this.logger
        ?.channel("actions", "authorize")
        .warn(
          `[actions] No PERMISSION_RESOLVER configured; permitting "${descriptor.permission}".`,
        );
      return next(passable);
    }

    const allowed = await this.resolver(descriptor.permission, passable.context);
    if (!allowed) {
      await this.events?.emit(ACTION_EVENTS.DENIED, { descriptor });
      passable.response = {
        success: false,
        message: `Permission denied: ${descriptor.permission}`,
      };
      return passable;
    }

    await this.events?.emit(ACTION_EVENTS.AUTHORIZED, { descriptor });
    return next(passable);
  }
}
