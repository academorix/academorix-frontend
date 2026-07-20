/**
 * @file ui.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the `@stackra/ui` cross-package services.
 */

/** Token for the imperative {@link IToastService}. */
export const TOAST_SERVICE = Symbol.for("TOAST_SERVICE");

/** Token for the imperative {@link IDialogService}. */
export const DIALOG_SERVICE = Symbol.for("DIALOG_SERVICE");

/** Token for the app-wide {@link IOverlayRegistry}. */
export const OVERLAY_REGISTRY = Symbol.for("OVERLAY_REGISTRY");
