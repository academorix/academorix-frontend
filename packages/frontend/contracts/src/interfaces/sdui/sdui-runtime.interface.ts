/**
 * @file sdui-runtime.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Runtime surface consumed by every SDUI-rendered subtree.
 */

import type { ISduiEvalScope } from "./sdui-screen.interface";

/**
 * A notification the SDUI runtime surfaces to the app.
 */
export interface ISduiNotification {
  readonly title: string;
  readonly description?: string;
  readonly status?: "info" | "success" | "warning" | "danger";
}

/**
 * Public runtime surface exposed by `<SduiRuntimeProvider>`.
 */
export interface ISduiRuntime {
  readonly scope: ISduiEvalScope;
  setState(path: string, value: unknown): void;
  toggleState(path: string): void;
  isOverlayOpen(overlayId: string): boolean;
  openOverlay(overlayId: string): void;
  closeOverlay(overlayId?: string): void;
  setFormField(formId: string, field: string, value: unknown): void;
  getFormValues(formId: string): Record<string, unknown>;
  notify(notification: ISduiNotification): void;
}
