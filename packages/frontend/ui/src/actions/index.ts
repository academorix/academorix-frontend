/**
 * @file index.ts
 * @module @stackra/ui/actions
 * @description Framework action handlers + supporting services shipped by
 *   `@stackra/ui`. Consumers wire them via `UiActionsModule.forRoot()`
 *   in their AppModule's imports.
 */

export { UiActionsModule } from "./ui-actions.module";
export { ToastService, type ToastListener } from "./services/toast.service";
export { DialogService } from "./services/dialog.service";
export { OverlayRegistry } from "./registries/overlay.registry";
export { ToastHandler } from "./handlers/toast.handler";
export { DialogHandler } from "./handlers/dialog.handler";
export { OpenOverlayHandler } from "./handlers/open-overlay.handler";
export { CloseOverlayHandler } from "./handlers/close-overlay.handler";
