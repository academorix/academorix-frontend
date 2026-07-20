/**
 * @file open-overlay.handler.ts
 * @module @stackra/ui/actions/handlers
 * @description OpenOverlayHandler — marks a named overlay open in the
 *   app-wide {@link IOverlayRegistry}.
 */

import { Inject, Injectable } from "@stackra/container";
import type {
  IActionContext,
  IActionHandler,
  IActionResponse,
  IOpenOverlayAction,
  IOverlayRegistry,
} from "@stackra/contracts";
import { ActionKind, OVERLAY_REGISTRY } from "@stackra/contracts";

/**
 * `OpenOverlayHandler` — dispatch handler for `ActionKind.OpenOverlay`.
 */
@Injectable()
export class OpenOverlayHandler implements IActionHandler<
  IOpenOverlayAction,
  { overlayId: string }
> {
  public readonly kind = ActionKind.OpenOverlay;

  public constructor(@Inject(OVERLAY_REGISTRY) private readonly registry: IOverlayRegistry) {}

  public execute(
    descriptor: IOpenOverlayAction,
    context: IActionContext,
  ): IActionResponse<{ overlayId: string }> {
    if (context.signal?.aborted) return { success: false, message: "Aborted" };
    this.registry.open(descriptor.overlayId, descriptor.payload);
    return { success: true, data: { overlayId: descriptor.overlayId } };
  }
}
