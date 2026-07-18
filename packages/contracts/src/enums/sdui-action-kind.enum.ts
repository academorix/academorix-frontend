/**
 * @file sdui-action-kind.enum.ts
 * @module @stackra/contracts/enums
 * @description Schema-level action kinds authored inside `ISduiNode.actions`.
 *   The SDUI action adapter maps these to framework `ActionKind` values
 *   at dispatch time.
 */

/**
 * Schema-level action kind — the string value that appears in a
 * `ISduiNode.actions.onPress[i].kind`.
 */
export enum SduiActionKind {
  Navigate = "navigate",
  OpenOverlay = "openOverlay",
  CloseOverlay = "closeOverlay",
  SetState = "setState",
  ToggleState = "toggleState",
  SubmitForm = "submitForm",
  CallApi = "callApi",
  Toast = "toast",
}
