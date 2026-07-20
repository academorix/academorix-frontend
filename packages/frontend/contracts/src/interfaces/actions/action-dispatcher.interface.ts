/**
 * @file action-dispatcher.interface.ts
 * @module @stackra/contracts/interfaces/actions
 * @description Contract for the single-entry-point action dispatcher.
 */

import type { IActionContext } from "./action-context.interface";
import type { IActionDescriptor } from "./action-descriptor.interface";
import type { IActionHandler } from "./action-handler.interface";
import type { IActionResponse } from "./action-response.interface";

/**
 * The action dispatcher — the seam every side effect flows through.
 */
export interface IActionDispatcher {
  /**
   * Dispatch a descriptor. Resolves the handler for `descriptor.kind`
   * and runs it through the middleware pipeline.
   */
  dispatch<D extends IActionDescriptor, R = unknown>(
    descriptor: D,
    context?: IActionContext,
  ): Promise<IActionResponse<R>>;

  /**
   * Imperatively register a handler.
   *
   * @returns An unregister function that removes the handler when called.
   */
  register(handler: IActionHandler): () => void;
}
