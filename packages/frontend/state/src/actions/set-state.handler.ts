/**
 * @file set-state.handler.ts
 * @module @stackra/state/actions
 * @description `SetStateHandler` — writes a value at a dotted path in a
 *   registered store.
 */

import { Injectable } from "@stackra/container";
import type {
  IActionContext,
  IActionHandler,
  IActionResponse,
  ISetStateAction,
} from "@stackra/contracts";
import { ActionKind } from "@stackra/contracts";
import { StateRegistry } from "../core/registries/state.registry";
import { setAtPath } from "./utils/dotted-path.util";

/**
 * `SetStateHandler` — dispatch handler for `ActionKind.SetState`.
 *
 * Resolves the store by `descriptor.storeToken` in the {@link StateRegistry}
 * and applies an immutable dotted-path update via `store.setState`.
 */
@Injectable()
export class SetStateHandler implements IActionHandler<
  ISetStateAction,
  { path: string; value: unknown }
> {
  public readonly kind = ActionKind.SetState;

  public constructor(private readonly registry: StateRegistry) {}

  public execute(
    descriptor: ISetStateAction,
    context: IActionContext,
  ): IActionResponse<{ path: string; value: unknown }> {
    if (context.signal?.aborted) return { success: false, message: "Aborted" };
    const token = descriptor.storeToken;
    if (!token) {
      return { success: false, message: "SetState requires a storeToken" };
    }
    const entry = this.registry.getAll().find((e) => e.token === token);
    if (!entry) {
      return {
        success: false,
        message: `No store registered under token "${String(token)}"`,
      };
    }

    const current = entry.store.state as Record<string, unknown>;
    const next = setAtPath(current ?? {}, descriptor.path, descriptor.value);
    entry.store.setState(() => next);

    return { success: true, data: { path: descriptor.path, value: descriptor.value } };
  }
}
