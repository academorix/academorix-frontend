/**
 * @file action-dispatcher.service.ts
 * @module @stackra/actions/core/services
 * @description ActionDispatcherService — the single entry point every
 *   side effect flows through.
 *
 *   Resolves the handler for a descriptor's `kind`, runs it through the
 *   configured middleware pipeline (`Authorize → Log → Trace → …`), and
 *   emits `ACTION_EVENTS.STARTED / SUCCEEDED / FAILED / HANDLER_REGISTERED`.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import { PIPELINE_FACTORY, type PipelineFactory } from "@stackra/pipeline";
import type {
  IActionContext,
  IActionDescriptor,
  IActionDispatcher,
  IActionHandler,
  IActionResponse,
  IActionsConfig,
  IEventEmitter,
  ILoggerManager,
} from "@stackra/contracts";
import { ACTION_CONFIG, ACTION_EVENTS, EVENT_EMITTER, LOGGER_MANAGER } from "@stackra/contracts";

import { ActionRegistry } from "../registries/action.registry";
import { AuthorizeMiddleware } from "../pipeline/authorize.middleware";
import { LogMiddleware } from "../pipeline/log.middleware";
import { TraceMiddleware } from "../pipeline/trace.middleware";
import type { IMiddlewarePassable } from "../pipeline/middleware-passable.interface";

/**
 * The action dispatcher.
 *
 * @example
 * ```ts
 * const response = await dispatcher.dispatch({
 *   kind: 'toast',
 *   status: 'success',
 *   message: 'Saved',
 * });
 * ```
 */
@Injectable()
export class ActionDispatcherService implements IActionDispatcher {
  public constructor(
    private readonly registry: ActionRegistry,
    @Inject(PIPELINE_FACTORY) private readonly pipelineFactory: PipelineFactory,
    @Inject(ACTION_CONFIG) private readonly config: IActionsConfig,
    private readonly authorize: AuthorizeMiddleware,
    private readonly log: LogMiddleware,
    private readonly trace: TraceMiddleware,
    @Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter,
    @Optional() @Inject(LOGGER_MANAGER) private readonly logger?: ILoggerManager,
  ) {}

  public async dispatch<D extends IActionDescriptor, R = unknown>(
    descriptor: D,
    context: IActionContext = {},
  ): Promise<IActionResponse<R>> {
    // Early-abort short-circuit.
    if (context.signal?.aborted) {
      return { success: false, message: "Aborted" } as IActionResponse<R>;
    }

    const handler = this.registry.resolve(descriptor.kind);
    if (!handler) {
      const response: IActionResponse = {
        success: false,
        message: `No handler registered for action kind "${descriptor.kind}"`,
      };
      await this.events?.emit(ACTION_EVENTS.FAILED, { descriptor, response });
      return response as IActionResponse<R>;
    }

    const passable: IMiddlewarePassable = { descriptor, context, handler };

    try {
      const finalPassable = await this.pipelineFactory<IMiddlewarePassable>()
        .send(passable)
        .through([this.authorize, this.log, this.trace, ...this.config.middleware])
        .then(async (p) => {
          // Terminal step — if the response is already populated (e.g.
          // by a short-circuiting middleware), skip the handler.
          if (p.response !== undefined) return p;
          try {
            p.response = await Promise.resolve(p.handler.execute(p.descriptor as never, p.context));
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger
              ?.channel("actions", "dispatcher")
              .warn(`[actions] Handler threw for kind "${p.descriptor.kind}": ${message}`);
            p.response = { success: false, message };
          }
          return p;
        });

      return (finalPassable.response ?? {
        success: false,
        message: "Handler returned no response",
      }) as IActionResponse<R>;
    } catch (err) {
      // Middleware/pipeline itself threw — return failure without crashing.
      const message = err instanceof Error ? err.message : String(err);
      this.logger?.channel("actions", "dispatcher").error(`[actions] Pipeline error: ${message}`);
      return { success: false, message } as IActionResponse<R>;
    }
  }

  public register(handler: IActionHandler): () => void {
    this.registry.register(handler.kind, handler);
    void this.events?.emit(ACTION_EVENTS.HANDLER_REGISTERED, { kind: handler.kind });
    return () => this.registry.unregister(handler.kind);
  }
}
