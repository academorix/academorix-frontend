/**
 * @file command.types.ts
 * @module menus/command.types
 *
 * @description
 * The **type contract** for the unified menu system that powers the three
 * menu surfaces described in `MENUS_PLAN.md`:
 *
 *   1. The native application top-bar (macOS-style menu bar) — Tauri only.
 *   2. The in-app top-bar chrome (workspace switcher, help, profile, search).
 *   3. The right-click context menu (rows, cells, sidebar items, canvas).
 *
 * Every menu item is a {@link MenuCommand} value object with a stable `id`, an
 * i18n `labelKey`, an optional keyboard `shortcut`, a permission `requires`
 * gate, a visibility predicate, and a side-effect `execute` callable. The
 * types below are **the** contract every renderer (context menu, palette,
 * shortcut sheet, top-bar dropdowns, native menu bridge) consumes.
 *
 * This file also re-exports the shared {@link MenuSurface}, {@link MenuCategory},
 * and {@link MenuContext} shapes so a downstream consumer can pull the whole
 * type surface from a single import path.
 *
 * ## Why the types re-live here (and not in `config/menu.config.ts`)
 *
 * The registry file (`src/config/menu.config.ts`) already declares these
 * shapes because the registry itself is authored in that file. We re-export
 * them from the `menus/` module so the public API of the menu system is
 * physically located next to its runtime — every consumer imports from
 * `@/menus` (not from `@/config/menu.config`). The re-export keeps a single
 * source of truth: modifying the shape in one file breaks the other at
 * compile time, which is exactly the safety net we want.
 *
 * ## The `formatShortcut` helper
 *
 * Renderers show shortcuts to users, and the canonical way to display
 * `CmdOrCtrl+K` is `⌘K` on macOS and `Ctrl+K` on Windows/Linux. The heavy
 * lifting lives in `@/config/shortcuts.config` where it can be reused by
 * non-menu code (documentation modals, the tour, keyboard cheat sheets).
 * We re-export it here so a caller importing `@/menus` has everything it
 * needs to render a menu item without reaching into a second module.
 *
 * @see MENUS_PLAN.md §2 — Command model
 * @see MENUS_PLAN.md §7 — Keyboard shortcuts
 */

import type { MenuCategory, MenuCommand, MenuContext, MenuSurface } from "@/config/menu.config";
import type { ShortcutOs } from "@/config/shortcuts.config";

/**
 * Re-exports of the canonical command shape from the registry. Consumers of
 * the `@/menus` module should import these from here rather than from
 * `@/config/menu.config` so the public API stays flat.
 */
export type { MenuCategory, MenuCommand, MenuContext, MenuSurface, ShortcutOs };

/**
 * The three concrete surfaces a command can appear on. Kept as a runtime
 * array (not just a type alias) so callers can iterate every surface at
 * boot — the boot-time conflict detector uses this to check each surface
 * independently for duplicate shortcuts.
 */
export const MENU_SURFACES: readonly MenuSurface[] = ["app", "context", "native"] as const;

/**
 * The canonical category display order (mirrors the native menu bar order
 * defined in `MENUS_PLAN.md` §4.2 and used by the context menu grouping).
 * Consumers should read this instead of hard-coding a category order so a
 * future re-ordering is a one-line change.
 */
export const MENU_CATEGORY_ORDER: readonly MenuCategory[] = [
  "application",
  "file",
  "edit",
  "view",
  "navigate",
  "workspace",
  "action",
  "help",
  "developer",
] as const;

// ---------------------------------------------------------------------------
// Shortcut formatting
// ---------------------------------------------------------------------------

// The core `formatShortcut` implementation lives in
// `@/config/shortcuts.config` — it is used by menu renderers, docs modals, and
// the tour. We re-export it here so consumers of `@/menus` have a single
// import surface for everything menu-related.
export { detectOs, formatShortcut } from "@/config/shortcuts.config";
