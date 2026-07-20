/**
 * @file close-overlay.handler.ts
 * @module @stackra/ui/actions/handlers
 * @description CloseOverlayHandler — closes an overlay by id, or the
 *   most recently opened when no id is supplied.
 */

import { Inject, Injectable } from "@stackra/container";
import type {
  IActionContext,
  IActionHandler,
  IActionResponse,
  ICloseOverlayAction,
  IOverlayRegistry,
} from "@stackra/contracts";
import { ActionKind, OVERLAY_REGISTRY } from "@stackra/contracts";

/**
 * `CloseOverlayHandler` — dispatch handler for `ActionKind.CloseOverlay`.
 */
@Injectable()
export class CloseOverlayHandler implements IActionHandler<
  ICloseOverlayAction,
  { overlayId?: string }
> {
  public readonly kind = ActionKind.CloseOverlay;

  public constructor(@Inject(OVERLAY_REGISTRY) private readonly registry: IOverlayRegistry) {}

  public execute(
    descriptor: ICloseOverlayAction,
    context: IActionContext,
  ): IActionResponse<{ overlayId?: string }> {
    if (context.signal?.aborted) return { success: false, message: "Aborted" };
    if (descriptor.overlayId) {
      this.registry.close(descriptor.overlayId);
    } else {
      this.registry.closeTop();
    }
    return { success: true, data: { overlayId: descriptor.overlayId } };
  }
}
