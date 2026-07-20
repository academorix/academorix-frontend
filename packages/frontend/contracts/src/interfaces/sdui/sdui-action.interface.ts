/**
 * @file sdui-action.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Schema-level action variants authored inside
 *   `ISduiNode.actions`. Adapted to framework `IActionDescriptor`s by the
 *   SDUI action adapter at dispatch time.
 */

import type { SduiBindable } from "./sdui-expression.interface";

/** `navigate` — push a route. */
export interface ISduiNavigateAction {
  readonly kind: "navigate";
  readonly to: string;
  readonly external?: boolean;
  readonly replace?: boolean;
}

/** `openOverlay` — open a named overlay. */
export interface ISduiOpenOverlayAction {
  readonly kind: "openOverlay";
  readonly overlayId: string;
  readonly payload?: SduiBindable;
}

/** `closeOverlay` — close a named overlay (or the most recent). */
export interface ISduiCloseOverlayAction {
  readonly kind: "closeOverlay";
  readonly overlayId?: string;
}

/** `setState` — write a value at a dotted path in the SDUI runtime state. */
export interface ISduiSetStateAction {
  readonly kind: "setState";
  readonly path: string;
  readonly value: SduiBindable;
}

/** `toggleState` — flip a boolean at a dotted path. */
export interface ISduiToggleStateAction {
  readonly kind: "toggleState";
  readonly path: string;
}

/** `submitForm` — collect form values and POST them. Composite under the hood. */
export interface ISduiSubmitFormAction {
  readonly kind: "submitForm";
  readonly formId: string;
  readonly endpoint: string;
  readonly method?: "POST" | "PUT" | "PATCH";
  readonly onSuccess?: readonly ISduiAction[];
}

/** `callApi` — arbitrary HTTP call with optional state assignment on success. */
export interface ISduiCallApiAction {
  readonly kind: "callApi";
  readonly endpoint: string;
  readonly method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly body?: Readonly<Record<string, SduiBindable>>;
  readonly assignTo?: string;
}

/** `toast` — surface a HeroUI toast. */
export interface ISduiToastAction {
  readonly kind: "toast";
  readonly status?: "info" | "success" | "warning" | "danger";
  readonly title: string;
  readonly description?: string;
}

/**
 * Union of every schema-level action variant. The SDUI action adapter
 * maps each variant to a framework `IActionDescriptor` before dispatch.
 */
export type ISduiAction =
  | ISduiNavigateAction
  | ISduiOpenOverlayAction
  | ISduiCloseOverlayAction
  | ISduiSetStateAction
  | ISduiToggleStateAction
  | ISduiSubmitFormAction
  | ISduiCallApiAction
  | ISduiToastAction;
