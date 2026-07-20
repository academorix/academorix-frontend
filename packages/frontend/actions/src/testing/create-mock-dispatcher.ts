/**
 * @file create-mock-dispatcher.ts
 * @module @stackra/actions/testing
 * @description In-memory mock action dispatcher for unit tests.
 */

import type {
  IActionContext,
  IActionDescriptor,
  IActionDispatcher,
  IActionHandler,
  IActionResponse,
} from "@stackra/contracts";

/**
 * A single dispatched-action record captured by the mock.
 */
export interface IMockDispatchCall<D extends IActionDescriptor = IActionDescriptor> {
  descriptor: D;
  context: IActionContext;
  response: IActionResponse;
}

/**
 * Public surface of the mock dispatcher.
 */
export interface IMockDispatcher extends IActionDispatcher {
  /** Every call recorded by this mock. */
  readonly calls: readonly IMockDispatchCall[];
  /** Reset the call log and clear registered handlers. */
  reset(): void;
}

/**
 * Create a scripted, assertable action dispatcher for unit tests.
 *
 * The mock resolves handlers imperatively registered via `register(...)`
 * and records every dispatch (descriptor + context + response) in
 * `.calls` for later assertion.
 */
export function createMockDispatcher(): IMockDispatcher {
  const registry = new Map<string, IActionHandler>();
  const calls: IMockDispatchCall[] = [];

  const dispatch = async <D extends IActionDescriptor, R = unknown>(
    descriptor: D,
    context: IActionContext = {},
  ): Promise<IActionResponse<R>> => {
    if (context.signal?.aborted) {
      const response: IActionResponse<R> = { success: false, message: "Aborted" };
      calls.push({ descriptor, context, response });
      return response;
    }
    const handler = registry.get(descriptor.kind);
    let response: IActionResponse<R>;
    if (!handler) {
      response = {
        success: false,
        message: `No handler registered for action kind "${descriptor.kind}"`,
      };
    } else {
      try {
        response = (await Promise.resolve(
          handler.execute(descriptor as never, context),
        )) as IActionResponse<R>;
      } catch (err) {
        response = { success: false, message: err instanceof Error ? err.message : String(err) };
      }
    }
    calls.push({ descriptor, context, response });
    return response;
  };

  const register = (handler: IActionHandler): (() => void) => {
    registry.set(handler.kind, handler);
    return () => registry.delete(handler.kind);
  };

  const reset = (): void => {
    registry.clear();
    calls.length = 0;
  };

  return { dispatch, register, calls, reset };
}
