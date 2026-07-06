/**
 * @file menu.config.ts
 * @module config/menu.config
 *
 * @description
 * Static schema + command-registry scaffold for the three menu surfaces
 * (native top-bar, in-app top bar, right-click context menu). Runtime
 * wiring lives in `src/menus/*` and mounts against this file.
 *
 * See `MENUS_PLAN.md` for the full architecture, per-surface rendering
 * rules, permission gating, and rollout phases.
 *
 * ## Status
 *
 * The command **types** are stable — every renderer (`src/menus/*`)
 * imports them from here. The command **registry** below is a starter
 * seed with the high-value entries; new commands land alongside the
 * feature they belong to. Adding a command is a one-line change plus a
 * translation key.
 *
 * ## Contract
 *
 *  - Every `id` is stable and analytics-friendly (`athlete.create`,
 *    `view.command_palette`).
 *  - Every `labelKey` is a dot-key into the message catalog.
 *  - `shortcut` uses the leader-key convention (`"G A"`, `"N A"`) for
 *    chords, and Tauri's accelerator format (`"CmdOrCtrl+K"`) for
 *    single-key shortcuts. See `shortcuts.config.ts` for the format.
 *  - `execute` is a side-effect callable. Async is fine.
 *  - `requires` names one or more permission codes; the shell hides
 *    (not disables) commands the user can't invoke.
 */

import type { ComponentType } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Where the command can appear. Default: all three. */
export type MenuSurface = "app" | "context" | "native";

/** Grouping used by the native menu bar + context menu section headers. */
export type MenuCategory =
  | "application" // About, Preferences, Quit
  | "file" // New, Open, Save, Export, Import
  | "edit" // Undo, Cut, Copy, Paste
  | "view" // Sidebar toggle, palette, theme
  | "workspace" // Switcher, Team invite, Settings
  | "navigate" // Go-to-resource
  | "action" // Create/edit/delete verbs
  | "help" // Docs, shortcuts, restart tour
  | "developer"; // Dev-only

/**
 * Read-only snapshot of app state a command needs at invocation time.
 * Populated by the renderer that opened the menu. Kept intentionally
 * loose so per-surface renderers can splice in extra target metadata.
 */
export interface MenuContext {
  /**
   * Currently-selected row(s), if any. Consumed by context-menu bulk
   * verbs. Shape mirrors DataGrid's selection payload.
   */
  selection?: readonly unknown[];
  /**
   * The DOM target that triggered the menu open (right-click element,
   * clicked button). Absent for the native menu bar.
   */
  target?: HTMLElement;
  /**
   * Where the menu was opened. Used for analytics scoping.
   */
  source?: "app-menu" | "context-menu" | "native-menu";
}

/** Canonical shape of a menu command. */
export interface MenuCommand {
  /** Stable id — analytics event property. `<subject>.<verb>` naming. */
  id: string;
  /** i18n message key for the primary label. */
  labelKey: string;
  /** i18n message key for optional descriptive text. */
  descriptionKey?: string;
  /**
   * Keyboard shortcut sequence. Leader-key chords (`"G A"`) or single
   * combos (`"CmdOrCtrl+K"`). See `shortcuts.config.ts`.
   */
  shortcut?: string;
  /** Categorical grouping. */
  category: MenuCategory;
  /**
   * Optional icon component. Web renders it; native OS menu bars
   * generally ignore item icons.
   */
  icon?: ComponentType<{ className?: string }>;
  /**
   * Backend permission code(s). Command is hidden when the check fails.
   * Passed through the app's `accessControlProvider`.
   */
  requires?: string | readonly string[];
  /**
   * Optional runtime visibility predicate. Runs AFTER the permission
   * check. Returning false hides the item.
   */
  isVisible?: (ctx: MenuContext) => boolean;
  /**
   * Renders greyed-out (still visible) when the predicate returns true.
   * Prefer `isVisible` when the command is fundamentally unavailable;
   * use `isDisabled` when the state might change (empty selection).
   */
  isDisabled?: (ctx: MenuContext) => boolean;
  /** Side-effect callable. */
  execute: (ctx: MenuContext) => void | Promise<void>;
  /**
   * Surfaces the command appears on. Default: all three.
   * `["native"]` means desktop-only (Quit, About Academorix, DevTools).
   * `["context"]` means right-click only (Copy id, Duplicate row).
   */
  surfaces?: readonly MenuSurface[];
}

// ---------------------------------------------------------------------------
// Registry seed
// ---------------------------------------------------------------------------

/**
 * Placeholder execute — every real command replaces this with a proper
 * side-effect. Left as a named function (not inline) so a call-site
 * showing `unimplemented` is instantly grep-friendly.
 */
function unimplemented(id: string): (ctx: MenuContext) => void {
  return () => {
    // eslint-disable-next-line no-console
    console.warn(`[menu] command '${id}' is not implemented yet — see MENUS_PLAN.md`);
  };
}

/**
 * Starter registry. Populated with the commands from MENUS_PLAN.md §3
 * that every version of the app should surface. Feature-specific
 * commands (e.g. `athlete.export`) land alongside their module.
 *
 * The **navigate** category is generated at runtime from
 * `AppResourceShortcuts` — DON'T list resource-navigate commands here.
 */
export const menuCommands: readonly MenuCommand[] = [
  // -------- Application (native menu bar) --------
  {
    id: "app.about",
    labelKey: "menu.about",
    category: "application",
    surfaces: ["native"],
    execute: unimplemented("app.about"),
  },
  {
    id: "app.preferences",
    labelKey: "menu.preferences",
    shortcut: "CmdOrCtrl+,",
    category: "application",
    execute: unimplemented("app.preferences"),
  },
  {
    id: "app.quit",
    labelKey: "menu.quit",
    shortcut: "CmdOrCtrl+Q",
    category: "application",
    surfaces: ["native"],
    execute: unimplemented("app.quit"),
  },

  // -------- View --------
  {
    id: "view.command_palette",
    labelKey: "menu.command_palette",
    shortcut: "CmdOrCtrl+K",
    category: "view",
    execute: unimplemented("view.command_palette"),
  },
  {
    id: "view.toggle_sidebar",
    labelKey: "menu.toggle_sidebar",
    shortcut: "CmdOrCtrl+\\",
    category: "view",
    execute: unimplemented("view.toggle_sidebar"),
  },
  {
    id: "view.toggle_theme",
    labelKey: "menu.toggle_theme",
    shortcut: "CmdOrCtrl+Shift+T",
    category: "view",
    execute: unimplemented("view.toggle_theme"),
  },

  // -------- Help --------
  {
    id: "help.docs",
    labelKey: "menu.docs",
    category: "help",
    execute: unimplemented("help.docs"),
  },
  {
    id: "help.keyboard_shortcuts",
    labelKey: "menu.keyboard_shortcuts",
    shortcut: "?",
    category: "help",
    execute: unimplemented("help.keyboard_shortcuts"),
  },
  {
    id: "help.restart_tour",
    labelKey: "menu.restart_tour",
    category: "help",
    execute: unimplemented("help.restart_tour"),
  },
  {
    id: "help.report_issue",
    labelKey: "menu.report_issue",
    category: "help",
    execute: unimplemented("help.report_issue"),
  },

  // -------- Developer (dev builds only) --------
  {
    id: "dev.toggle_devtools",
    labelKey: "menu.devtools",
    shortcut: "CmdOrCtrl+Alt+I",
    category: "developer",
    surfaces: ["native"],
    isVisible: () => import.meta.env.DEV,
    execute: unimplemented("dev.toggle_devtools"),
  },
] as const;

/**
 * Category display order in the native menu bar. Left-to-right on
 * macOS/Windows/Linux. `application` gets a special slot — Tauri
 * inserts it before everything else on macOS automatically.
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
];

/** Bundled menu config. */
export const menuConfig = {
  commands: menuCommands,
  categoryOrder: MENU_CATEGORY_ORDER,
} as const;
