/**
 * @file trace.middleware.ts
 * @module @stackra/actions/core/pipeline
 * @description Trace middleware — emits `ACTION_EVENTS.STARTED` before
 *   handler invocation and one of `SUCCEEDED` / `FAILED` after.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import type { IEventEmitter } from "@stackra/contracts";
import { ACTION_EVENTS, EVENT_EMITTER } from "@stackra/contracts";

import type { IMiddlewarePassable } from "./middleware-passable.interface";

/**
 * Trace middleware — emits START/SUCCESS/FAIL events on the shared bus.
 */
@Injectable()
export class TraceMiddleware {
  public constructor(@Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter) {}

  public async handle(
    passable: IMiddlewarePassable,
    next: (p: IMiddlewarePassable) => Promise<IMiddlewarePassable>,
  ): Promise<IMiddlewarePassable> {
    passable.startedAt = Date.now();
    await this.events?.emit(ACTION_EVENTS.STARTED, {
      descriptor: passable.descriptor,
      startedAt: passable.startedAt,
    });
    const result = await next(passable);
    const elapsedMs = Date.now() - (result.startedAt ?? passable.startedAt);
    const success = result.response?.success ?? false;
    await this.events?.emit(success ? ACTION_EVENTS.SUCCEEDED : ACTION_EVENTS.FAILED, {
      descriptor: passable.descriptor,
      response: result.response,
      elapsedMs,
    });
    return result;
  }
}
