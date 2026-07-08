/**
 * @file index.ts
 * @module menus
 *
 * @description
 * Public barrel for the unified menu system documented in menus module.
 * Consumers import everything they need to render a menu — the type
 * contract, the runtime hook, the visual renderer, the shared registry
 * helpers, and the cross-tree action bus — from a single path:
 *
 *   import {
 *     ContextMenu,
 *     MenuActionsBridge,
 *     invokeMenuAction,
 *     useContextMenu,
 *     useMenuAction,
 *   } from "@/lib/menus";
 *
 * Anything not re-exported here is by intention an **implementation
 * detail** (internal render helpers, private constants) that should not
 * cross module boundaries.
 */

export type {
  MenuCategory,
  MenuCommand,
  MenuContext,
  MenuSurface,
  ShortcutOs,
} from "@/lib/menus/command.types";
export {
  MENU_CATEGORY_ORDER,
  MENU_SURFACES,
  detectOs,
  formatShortcut,
} from "@/lib/menus/command.types";
export { ContextMenu, TOP_LEVEL_LIMIT, splitOverflow } from "@/lib/menus/context-menu";
export { MenuActionsBridge } from "@/lib/menus/menu-actions-bridge";
export { invokeMenuAction, useMenuAction } from "@/lib/menus/menu-actions";
export {
  assertNoDuplicateShortcuts,
  filterVisibleCommands,
  groupByCategory,
  resolveShortcutDisplay,
} from "@/lib/menus/registry-helpers";
export type { ShortcutCollision } from "@/lib/menus/registry-helpers";
export { clampToViewport, useContextMenu } from "@/lib/menus/use-context-menu";
export type {
  ContextMenuPosition,
  UseContextMenuOptions,
  UseContextMenuReturn,
} from "@/lib/menus/use-context-menu";
