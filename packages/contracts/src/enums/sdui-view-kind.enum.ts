/**
 * @file sdui-view-kind.enum.ts
 * @module @stackra/contracts/enums
 * @description Well-known scene taxonomy for SDUI layouts.
 */

/**
 * The six built-in scene layouts SDUI ships. Consumers register custom
 * layouts under any string key — this enum only names the built-ins so
 * consumers can reference them without repeating string literals.
 */
export enum SduiViewKind {
  List = "list",
  Show = "show",
  Create = "create",
  Edit = "edit",
  Analytics = "analytics",
  Overview = "overview",
}
