/**
 * @file dialog.handler.ts
 * @module @stackra/ui/actions/handlers
 * @description DialogHandler — opens a registered dialog by id.
 */

import { Inject, Injectable } from "@stackra/container";
import type {
  IActionContext,
  IActionHandler,
  IActionResponse,
  IDialogAction,
  IDialogService,
} from "@stackra/contracts";
import { ActionKind, DIALOG_SERVICE } from "@stackra/contracts";

/**
 * `DialogHandler` — dispatch handler for `ActionKind.Dialog`.
 */
@Injectable()
export class DialogHandler implements IActionHandler<IDialogAction, { dialogId: string }> {
  public readonly kind = ActionKind.Dialog;

  public constructor(@Inject(DIALOG_SERVICE) private readonly dialog: IDialogService) {}

  public execute(
    descriptor: IDialogAction,
    context: IActionContext,
  ): IActionResponse<{ dialogId: string }> {
    if (context.signal?.aborted) return { success: false, message: "Aborted" };
    if (!this.dialog.has(descriptor.dialogId)) {
      return {
        success: false,
        message: `No dialog registered under "${descriptor.dialogId}"`,
      };
    }
    this.dialog.open(descriptor.dialogId, descriptor.payload);
    return { success: true, data: { dialogId: descriptor.dialogId } };
  }
}
