/**
 * @file toast.handler.ts
 * @module @stackra/ui/actions/handlers
 * @description ToastHandler — dispatches `IToastAction` through the
 *   configured {@link IToastService}.
 */

import { Inject, Injectable } from "@stackra/container";
import type {
  IActionContext,
  IActionHandler,
  IActionResponse,
  IToastAction,
  IToastService,
} from "@stackra/contracts";
import { ActionKind, TOAST_SERVICE } from "@stackra/contracts";

const STATUS_TO_VARIANT: Record<
  Required<IToastAction>["status"],
  "accent" | "success" | "warning" | "danger"
> = {
  info: "accent",
  success: "success",
  warning: "warning",
  danger: "danger",
};

/**
 * `ToastHandler` — dispatch handler for `ActionKind.Toast`.
 */
@Injectable()
export class ToastHandler implements IActionHandler<IToastAction> {
  public readonly kind = ActionKind.Toast;

  public constructor(@Inject(TOAST_SERVICE) private readonly toast: IToastService) {}

  public execute(descriptor: IToastAction, context: IActionContext): IActionResponse {
    if (context.signal?.aborted) return { success: false, message: "Aborted" };
    const variant = STATUS_TO_VARIANT[descriptor.status ?? "info"];
    const title = descriptor.title ?? descriptor.message;
    const description = descriptor.title ? descriptor.message : descriptor.description;
    this.toast.show(title, { description, variant });
    return { success: true };
  }
}
