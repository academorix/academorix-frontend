/**
 * @file toggle-state.handler.ts
 * @module @stackra/state/actions
 * @description `ToggleStateHandler` — flips a boolean at a dotted path.
 */

import { Injectable } from "@stackra/container";
import type {
  IActionContext,
  IActionHandler,
  IActionResponse,
  IToggleStateAction,
} from "@stackra/contracts";
import { ActionKind } from "@stackra/contracts";
import { StateRegistry } from "../core/registries/state.registry";
import { SetStateHandler } from "./set-state.handler";
import { getAtPath } from "./utils/dotted-path.util";

/**
 * `ToggleStateHandler` — dispatch handler for `ActionKind.ToggleState`.
 *
 * Reads the current value at `descriptor.path`, coerces to boolean,
 * negates, and writes back via {@link SetStateHandler}.
 */
@Injectable()
export class ToggleStateHandler implements IActionHandler<
  IToggleStateAction,
  { path: string; value: boolean }
> {
  public readonly kind = ActionKind.ToggleState;

  public constructor(
    private readonly registry: StateRegistry,
    private readonly setter: SetStateHandler,
  ) {}

  public execute(
    descriptor: IToggleStateAction,
    context: IActionContext,
  ): IActionResponse<{ path: string; value: boolean }> {
    if (context.signal?.aborted) return { success: false, message: "Aborted" };
    if (!descriptor.storeToken) {
      return { success: false, message: "ToggleState requires a storeToken" };
    }
    const entry = this.registry.getAll().find((e) => e.token === descriptor.storeToken);
    if (!entry) {
      return {
        success: false,
        message: `No store registered under token "${String(descriptor.storeToken)}"`,
      };
    }

    const current = getAtPath(entry.store.state as Record<string, unknown>, descriptor.path);
    const next = !Boolean(current);
    const response = this.setter.execute(
      {
        kind: ActionKind.SetState,
        storeToken: descriptor.storeToken,
        path: descriptor.path,
        value: next,
      },
      context,
    );
    if (!response.success) return response as IActionResponse<{ path: string; value: boolean }>;
    return { success: true, data: { path: descriptor.path, value: next } };
  }
}
