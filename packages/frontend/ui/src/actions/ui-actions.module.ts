/**
 * @file ui-actions.module.ts
 * @module @stackra/ui/actions
 * @description DI module that binds the UI-owned action services
 *   (`ToastService`, `DialogService`, `OverlayRegistry`) under their
 *   contract tokens. Consumers import this module in their AppModule
 *   when they wire the UI action handlers via `ActionsModule.forFeature`.
 */

import { Global, Module, type DynamicModule } from "@stackra/container";
import { DIALOG_SERVICE, OVERLAY_REGISTRY, TOAST_SERVICE } from "@stackra/contracts";

import { DialogService } from "./services/dialog.service";
import { OverlayRegistry } from "./registries/overlay.registry";
import { ToastService } from "./services/toast.service";

/**
 * DI module binding the UI action services under their contract tokens.
 */
@Global()
@Module({})
export class UiActionsModule {
  public static forRoot(): DynamicModule {
    return {
      module: UiActionsModule,
      global: true,
      providers: [
        ToastService,
        { provide: TOAST_SERVICE, useExisting: ToastService },
        DialogService,
        { provide: DIALOG_SERVICE, useExisting: DialogService },
        OverlayRegistry,
        { provide: OVERLAY_REGISTRY, useExisting: OverlayRegistry },
      ],
      exports: [
        TOAST_SERVICE,
        DIALOG_SERVICE,
        OVERLAY_REGISTRY,
        ToastService,
        DialogService,
        OverlayRegistry,
      ],
    };
  }
}
