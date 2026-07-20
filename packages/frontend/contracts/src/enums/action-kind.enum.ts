/**
 * @file action-kind.enum.ts
 * @module @stackra/contracts/enums
 * @description Well-known action `kind` values that the framework
 *   publishes handlers for.
 */

/**
 * Well-known action kinds. Custom apps declare their own kinds with
 * `IActionDescriptor<'my.custom.kind'>` — the enum is not exhaustive.
 */
export enum ActionKind {
  Navigate = "navigate",
  Toast = "toast",
  Dialog = "dialog",
  SetState = "setState",
  ToggleState = "toggleState",
  Query = "query",
  Mutate = "mutate",
  Composite = "composite",
  Refresh = "refresh",
  Download = "download",
  Upload = "upload",
  OpenOverlay = "openOverlay",
  CloseOverlay = "closeOverlay",
  Realtime = "realtime",
  Dispatch = "dispatch",
  /**
   * `ai.tool` — invoke a locally-registered AI client tool through the
   * action pipeline. Bridges the `@stackra/ai` tool subsystem into the
   * one framework Action seam (authorize / log / trace / cancel).
   */
  AiTool = "ai.tool",
}
