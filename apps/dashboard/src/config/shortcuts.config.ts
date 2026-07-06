/**
 * @file shortcuts.config.ts
 * @module config/shortcuts.config
 *
 * @description
 * Global keyboard-shortcut constants. Resource-scoped shortcuts (navigate
 * to X, create X) live on `AppResourceMeta.shortcuts` inside each module
 * manifest — this file only owns the app-chrome shortcuts that are the
 * same everywhere, plus the formatting helpers every renderer needs.
 *
 * See `MENUS_PLAN.md` §7 and `DASHBOARD_UX_PLAN.md` §13.2 for the design
 * rationale.
 *
 * ## Format
 *
 * Two shortcut formats coexist:
 *
 *  1. **Chords / leader-key** — space-separated tokens: `"G A"`
 *     ("g then a"). Used for resource-scoped navigate / create verbs.
 *     Consumed by our own keyboard registry.
 *
 *  2. **Modifier combos** — Tauri-flavoured accelerators:
 *     `"CmdOrCtrl+K"`, `"CmdOrCtrl+Shift+T"`. Used for single-keystroke
 *     shortcuts. `CmdOrCtrl` picks `Cmd` on macOS and `Ctrl` elsewhere.
 *
 * Renderers use {@link formatShortcut} to convert to display glyphs:
 * `⌘K` on macOS, `Ctrl+K` on Windows/Linux.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** OS kind — drives glyph mapping. */
export type ShortcutOs = "mac" | "windows" | "linux";

/** A shortcut declaration. */
export interface ShortcutBinding {
  /** Stable id — analytics event property. */
  id: string;
  /** i18n key for the display label. */
  labelKey: string;
  /** Accelerator string (see file docblock for format). */
  accelerator: string;
  /** Optional description (shown in the ? shortcuts sheet). */
  descriptionKey?: string;
  /** Category grouping in the shortcuts sheet. */
  category: "global" | "navigation" | "creation" | "action" | "editor";
}

// ---------------------------------------------------------------------------
// Global chrome shortcuts
// ---------------------------------------------------------------------------

/**
 * Shortcuts that live in the app shell — never module-owned. Anything
 * resource-scoped (Go to Athletes, New Athlete) belongs on
 * `AppResourceMeta.shortcuts` and NOT here.
 */
export const GLOBAL_SHORTCUTS: readonly ShortcutBinding[] = [
  {
    id: "global.command_palette",
    labelKey: "shortcuts.command_palette",
    accelerator: "CmdOrCtrl+K",
    category: "global",
  },
  {
    id: "global.toggle_sidebar",
    labelKey: "shortcuts.toggle_sidebar",
    accelerator: "CmdOrCtrl+\\",
    category: "global",
  },
  {
    id: "global.toggle_theme",
    labelKey: "shortcuts.toggle_theme",
    accelerator: "CmdOrCtrl+Shift+T",
    category: "global",
  },
  {
    id: "global.preferences",
    labelKey: "shortcuts.preferences",
    accelerator: "CmdOrCtrl+,",
    category: "global",
  },
  {
    id: "global.shortcuts_sheet",
    labelKey: "shortcuts.shortcuts_sheet",
    accelerator: "?",
    category: "global",
  },
  {
    id: "global.escape",
    labelKey: "shortcuts.escape",
    accelerator: "Escape",
    category: "global",
  },

  // -------- Navigation leaders (documented; per-resource in module meta) --------
  {
    id: "global.navigate_leader",
    labelKey: "shortcuts.navigate_leader",
    descriptionKey: "shortcuts.navigate_leader_desc",
    accelerator: "G ?",
    category: "navigation",
  },
  {
    id: "global.create_leader",
    labelKey: "shortcuts.create_leader",
    descriptionKey: "shortcuts.create_leader_desc",
    accelerator: "N ?",
    category: "creation",
  },
] as const;

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** Symbol glyphs per platform for common modifiers. */
const MODIFIER_GLYPHS: Record<ShortcutOs, Record<string, string>> = {
  mac: {
    CmdOrCtrl: "⌘",
    Cmd: "⌘",
    Ctrl: "⌃",
    Alt: "⌥",
    Option: "⌥",
    Shift: "⇧",
    Meta: "⌘",
    Enter: "↵",
    Escape: "⎋",
    Backspace: "⌫",
    Delete: "⌦",
    Tab: "⇥",
    Space: "␣",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
  },
  windows: {
    CmdOrCtrl: "Ctrl",
    Cmd: "Win",
    Ctrl: "Ctrl",
    Alt: "Alt",
    Option: "Alt",
    Shift: "Shift",
    Meta: "Win",
    Enter: "Enter",
    Escape: "Esc",
    Backspace: "Backspace",
    Delete: "Delete",
    Tab: "Tab",
    Space: "Space",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
  },
  linux: {
    CmdOrCtrl: "Ctrl",
    Cmd: "Super",
    Ctrl: "Ctrl",
    Alt: "Alt",
    Option: "Alt",
    Shift: "Shift",
    Meta: "Super",
    Enter: "Enter",
    Escape: "Esc",
    Backspace: "Backspace",
    Delete: "Delete",
    Tab: "Tab",
    Space: "Space",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
  },
};

/**
 * Detects OS from the browser's `navigator.userAgentData` (or the
 * legacy `navigator.platform` as a fallback). Safe to call at import
 * time — falls back to `"mac"` in Node/SSR.
 */
export function detectOs(): ShortcutOs {
  if (typeof navigator === "undefined") return "mac";

  const platform =
    "userAgentData" in navigator &&
    typeof navigator.userAgentData === "object" &&
    navigator.userAgentData !== null &&
    "platform" in navigator.userAgentData
      ? (navigator.userAgentData.platform as string)
      : navigator.platform || "";

  const p = platform.toLowerCase();

  if (p.includes("mac") || p.includes("darwin")) return "mac";
  if (p.includes("win")) return "windows";

  return "linux";
}

/**
 * Formats an accelerator string for display. Handles:
 *
 *  - Modifier combos: `"CmdOrCtrl+K"` → `"⌘K"` (mac) / `"Ctrl+K"` (win/linux).
 *  - Leader chords: `"G A"` → `"G A"` (unchanged; already user-facing).
 *  - Mixed: `"CmdOrCtrl+Shift+T"` → `"⌘⇧T"` (mac) / `"Ctrl+Shift+T"` (win).
 *
 * @param accelerator - Raw accelerator string.
 * @param os - Target OS. Defaults to auto-detected.
 */
export function formatShortcut(accelerator: string, os: ShortcutOs = detectOs()): string {
  // Chord (space-separated) — display unchanged.
  if (accelerator.includes(" ") && !accelerator.includes("+")) {
    return accelerator.toUpperCase();
  }

  const parts = accelerator.split("+");
  const glyphs = MODIFIER_GLYPHS[os];
  const rendered = parts.map((part) => glyphs[part] ?? part);

  // On macOS the modifier keys are stitched together without a separator.
  // On Windows/Linux we use `+` between every part to match native docs.
  return os === "mac" ? rendered.join("") : rendered.join("+");
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

/** Bundled shortcuts config. */
export const shortcutsConfig = {
  global: GLOBAL_SHORTCUTS,
  detectOs,
  formatShortcut,
} as const;
