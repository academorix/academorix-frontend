/**
 * @file action-handler.interface.ts
 * @module @stackra/contracts/interfaces/actions
 * @description Contract for a class or object that handles one action
 *   kind.
 */

import type { IActionDescriptor } from "./action-descriptor.interface";
import type { IActionContext } from "./action-context.interface";
import type { IActionResponse } from "./action-response.interface";

/**
 * Contract for an action handler.
 *
 * A handler owns the logic that turns a descriptor into a real side
 * effect. Handlers are `@Injectable()` classes (registered via
 * `ActionsModule.forFeature(...)` or the `@ActionHandler` decorator) or
 * plain objects (registered imperatively via `dispatcher.register(...)`).
 *
 * @typeParam D - The descriptor variant this handler accepts.
 * @typeParam R - The response payload type on success.
 */
export interface IActionHandler<D extends IActionDescriptor = IActionDescriptor, R = unknown> {
  /** The `kind` string this handler is registered under. */
  readonly kind: D["kind"];

  /**
   * Execute the action.
   *
   * Never throw — return `{ success: false, message }` for expected
   * failures so the dispatcher's outer `try/catch` remains a safety net,
   * not the primary error surface.
   */
  execute(descriptor: D, context: IActionContext): Promise<IActionResponse<R>> | IActionResponse<R>;
}
