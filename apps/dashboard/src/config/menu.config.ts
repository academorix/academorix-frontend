/**
 * @file menu.config.ts
 * @module config/menu.config
 *
 * @description
 * Static schema + command-registry for the three menu surfaces (native
 * top-bar, in-app top bar, right-click context menu). Runtime wiring
 * lives in `src/menus/*` and mounts against this file.
 *
 * The three surfaces (native menu bar on Tauri, in-app top-bar dropdowns,
 * right-click context menu) all read this same registry — see the modules
 * under `src/menus/**` for the per-surface renderers, permission gating,
 * and IPC bridge to the Tauri Rust side.
 *
 * ## Status
 *
 * The command **types** are stable — every renderer (`src/menus/*`)
 * imports them from here. The command **registry** below carries the
 * high-value entries (Application, View, Help, Developer) that ship
 * with the initial rollout. Resource-scoped commands
 * (`athlete.create`, `session.create`, …) land alongside their module
 * manifests and are merged into the registry at boot.
 *
 * ## Contract
 *
 *  - Every `id` is stable and analytics-friendly (`view.command_palette`,
 *    `help.docs`). Consumers may compare ids across releases.
 *  - Every `labelKey` is a dot-key into the message catalog; renderers
 *    resolve them through Refine's `useTranslate()`.
 *  - `shortcut` uses the leader-key convention (`"G A"`, `"N A"`) for
 *    chords, and Tauri's accelerator format (`"CmdOrCtrl+K"`) for
 *    single-key shortcuts. See `shortcuts.config.ts`.
 *  - `execute` is a side-effect callable. Actions that need to reach
 *    into a live React subtree call {@link "@/lib/menus/menu-actions"
 *    invokeMenuAction}, an event bus consumed by service-based
 *    hooks (`useCommandPalette`, `useTheme`, `useSidebar`) inside the
 *    shell subtree. Actions that just open a URL or navigate stay
 *    inline.
 *  - `requires` names one or more permission codes; the shell hides
 *    (not disables) commands the user can't invoke.
 *
 * ## Native-only commands
 *
 * Three commands ship with `surfaces: ["native"]` — they never render on
 * web and therefore never fire their `execute` on this build. Their
 * handlers are placeholders that log a warning; the desktop bridge
 * (`src/desktop/native-menu.ts` — Sub-agent D) replaces them with real
 * Tauri IPC calls at Phase 2:
 *
 *  - `app.about`            → opens a native About panel
 *  - `app.quit`             → asks Tauri to close every window
 *  - `dev.toggle_devtools`  → opens the WebView devtools
 */

import type { ComponentType } from "react";

import { invokeMenuAction } from "@/lib/menus/menu-actions";

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
// Handler helpers
// ---------------------------------------------------------------------------

/**
 * Handler stub for commands that only run on the desktop native surface.
 * The web bundle never renders these (they carry `surfaces: ["native"]`)
 * so `execute` is unreachable in practice — but a defensive log helps
 * during the interim before Sub-agent D wires the Tauri IPC bridge.
 */
function nativePlaceholder(id: string): (ctx: MenuContext) => void {
  return () => {
    // eslint-disable-next-line no-console
    console.warn(
      `[menu] native-only command "${id}" fired on the web bundle — this should be unreachable. The Tauri IPC bridge in \`src/desktop/native-menu.ts\` is responsible for routing native menu clicks.`,
    );
  };
}

/**
 * External-link helper for commands that navigate to an out-of-app
 * resource (docs, issue tracker). Uses `window.open` with the
 * `noopener,noreferrer` combo so the linked site cannot reach back into
 * the SPA's `window` reference. Silent no-op when `window` is absent
 * (test env, SSR probe).
 */
function openExternal(url: string): (ctx: MenuContext) => void {
  return () => {
    if (typeof window === "undefined") {
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };
}

/**
 * Navigate to an in-app path via full-document assignment. We can't
 * pull in `useNavigate` at module scope; a hash-based assignment is the
 * simplest cross-tree navigation that still respects the SPA's routes
 * (Vite dev server + Vercel rewrites both treat `location.assign('/x')`
 * as a client-side navigation because the shell owns every route).
 */
function navigateTo(path: string): (ctx: MenuContext) => void {
  return () => {
    if (typeof window === "undefined") {
      return;
    }

    window.location.assign(path);
  };
}

/**
 * Restart the onboarding tour. Imports the module-scoped entry point
 * from `@/lib/onboarding` (owned by Sub-agent O) — the entry is a stable
 * side-effect handle the tour provider populates on mount, so a call
 * before the provider mounts is a silent no-op.
 *
 * Kept as a named handler (not inline) so the analytics trigger stays
 * grep-friendly — every `restartTour` call in the app funnels here.
 *
 * We use a dynamic import to avoid a boot-time cycle: the onboarding
 * module imports menu types from this file for its tour anchors, so a
 * top-level import here would create a circular dependency during
 * module resolution.
 */
function restartTour(): void {
  void import("@/lib/onboarding").then((mod) => {
    mod.restartTour();
  });
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * The starter registry. Populated with every command surfaced by the app
 * chrome (help, view, workspace, and per-resource navigate/create actions).
 * Feature-specific commands (`athlete.export`, `session.duplicate`, …) land
 * alongside their
 * module manifest and merge into the registry at boot.
 *
 * The **navigate** category is generated at runtime from
 * `AppResourceShortcuts` — DON'T list resource-navigate commands here.
 */
export const menuCommands: readonly MenuCommand[] = [
  // -------- Application (native menu bar only) --------
  {
    id: "app.about",
    labelKey: "menu.about",
    category: "application",
    surfaces: ["native"],
    execute: nativePlaceholder("app.about"),
  },
  {
    id: "app.preferences",
    labelKey: "menu.preferences",
    shortcut: "CmdOrCtrl+,",
    category: "application",
    // Navigate to the settings landing route. The tenant SPA owns
    // `/settings` today; a future workspace-scoped preferences page
    // takes over without changing the menu id.
    execute: navigateTo("/settings"),
  },
  {
    id: "app.quit",
    labelKey: "menu.quit",
    shortcut: "CmdOrCtrl+Q",
    category: "application",
    surfaces: ["native"],
    execute: nativePlaceholder("app.quit"),
  },

  // -------- View --------
  {
    id: "view.command_palette",
    labelKey: "menu.command_palette",
    shortcut: "CmdOrCtrl+K",
    category: "view",
    // Fires the `view.command_palette` action; the palette listens on
    // that event via `useCommandPalette`. The ⌘K shortcut itself is
    // bound inside the palette so this menu entry is the mouse/touch
    // fallback.
    execute: () => invokeMenuAction("view.command_palette"),
  },
  {
    id: "view.toggle_sidebar",
    labelKey: "menu.toggle_sidebar",
    shortcut: "CmdOrCtrl+\\",
    category: "view",
    // Sidebar.Provider (in HeroUI's AppLayout) exposes `toggleSidebar()`
    // via its context; the bridge component reads that context and
    // subscribes to this action.
    execute: () => invokeMenuAction("view.toggle_sidebar"),
  },
  {
    id: "view.toggle_theme",
    labelKey: "menu.toggle_theme",
    shortcut: "CmdOrCtrl+Shift+T",
    category: "view",
    // Bridged to HeroUI's `useTheme` — flips between light and dark.
    // The theme switcher UI (`components/theme/theme-switcher.tsx`)
    // still owns the "system" preference; this shortcut just toggles
    // resolved appearance for immediate visual feedback.
    execute: () => invokeMenuAction("view.toggle_theme"),
  },

  // -------- Help --------
  {
    id: "help.docs",
    labelKey: "menu.docs",
    category: "help",
    // External docs site — always opens in a new tab. Kept as a
    // stable URL so a docs re-platforming is a single-line change.
    execute: openExternal("https://docs.academorix.com/"),
  },
  {
    id: "help.keyboard_shortcuts",
    labelKey: "menu.keyboard_shortcuts",
    shortcut: "?",
    category: "help",
    // Opens the shortcut sheet via the same action bus. The `?`
    // shortcut itself is bound inside the sheet provider — this menu
    // entry is the pointer fallback.
    execute: () => invokeMenuAction("help.keyboard_shortcuts"),
  },
  {
    id: "help.restart_tour",
    labelKey: "menu.restart_tour",
    category: "help",
    execute: restartTour,
  },
  {
    id: "help.report_issue",
    labelKey: "menu.report_issue",
    category: "help",
    // GitHub issue tracker for now; replaced with a first-party
    // support form when the marketing site lands.
    execute: openExternal("https://github.com/academorix/academorix/issues/new"),
  },

  // -------- Developer (dev builds only) --------
  {
    id: "dev.toggle_devtools",
    labelKey: "menu.devtools",
    shortcut: "CmdOrCtrl+Alt+I",
    category: "developer",
    surfaces: ["native"],
    isVisible: () => import.meta.env.DEV,
    execute: nativePlaceholder("dev.toggle_devtools"),
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
