/**
 * @file dispatch.handler.ts
 * @module @stackra/actions/core/handlers
 * @description Dispatch handler — indirection to another registered
 *   action kind by name.
 */

import { Inject, Injectable } from '@stackra/container';
import type {
  IActionContext,
  IActionDispatcher,
  IActionResponse,
  IDispatchAction,
} from '@stackra/contracts';
import { ACTION_DISPATCHER, ActionKind } from '@stackra/contracts';

/**
 * Dispatch handler — re-dispatches `payload` against the handler
 * registered under `name`.
 *
 * Enables named aliases (`orders.approve` → any custom handler) so
 * schemas and hand-written code target a stable domain name that
 * consumers can override.
 */
@Injectable()
export class DispatchHandler {
  public readonly kind = ActionKind.Dispatch;

  public constructor(@Inject(ACTION_DISPATCHER) private readonly dispatcher: IActionDispatcher) {}

  public async execute(
    descriptor: IDispatchAction,
    context: IActionContext
  ): Promise<IActionResponse> {
    return this.dispatcher.dispatch({ ...descriptor.payload, kind: descriptor.name }, context);
  }
}
