/**
 * @file composite.handler.ts
 * @module @stackra/actions/core/handlers
 * @description Composite handler — runs a list of descriptors
 *   sequentially through the dispatcher.
 */

import { Inject, Injectable } from "@stackra/container";
import type {
  IActionContext,
  IActionDispatcher,
  IActionResponse,
  ICompositeAction,
} from "@stackra/contracts";
import { ACTION_DISPATCHER, ActionKind } from "@stackra/contracts";

/**
 * Composite handler.
 *
 * Runs each descriptor in `actions` through the dispatcher. Stops on the
 * first failure unless `stopOnFailure: false`. Returns the last response.
 */
@Injectable()
export class CompositeHandler {
  public readonly kind = ActionKind.Composite;

  public constructor(@Inject(ACTION_DISPATCHER) private readonly dispatcher: IActionDispatcher) {}

  public async execute(
    descriptor: ICompositeAction,
    context: IActionContext,
  ): Promise<IActionResponse> {
    let last: IActionResponse = { success: true };
    for (const step of descriptor.actions) {
      last = await this.dispatcher.dispatch(step, context);
      if (!last.success && descriptor.stopOnFailure !== false) return last;
    }
    return last;
  }
}
