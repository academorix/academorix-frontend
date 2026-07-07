/**
 * @file desktop.config.ts
 * @module config/desktop.config
 *
 * @description
 * Single source of truth for **every desktop-app knob** — window sizing,
 * tray, deep-link scheme, auto-updater endpoint, global shortcut, security
 * capabilities. TypeScript-authored so the SPA (`src/desktop/*`) and the
 * Rust shell (`src-tauri/*`) read the same values.
 *
 * Rust reads a serialized JSON snapshot at build time via a small
 * `build.rs` script — never a runtime IPC lookup — so options here
 * influence the Tauri configuration file (`tauri.conf.json`) that ships
 * to end users.
 *
 * See `DESKTOP_PLAN.md` for the full rationale, phased rollout, and
 * integration points.
 *
 * ## Status
 *
 * Phase 1 of the desktop rollout — the `apps/dashboard/src-tauri/`
 * Rust project reads a JSON snapshot of this file at build time (see
 * `src-tauri/build.rs`), so any change here must be paired with a
 * clean rebuild of the Rust side (`cargo build`). The SPA reads the
 * same values via `src/desktop/*`.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single tray-icon menu item. Rendered by Tauri's native tray API when
 * `isDesktop`.
 */
export interface TrayItem {
  /** Stable id — used as the IPC event key. */
  id: string;
  /** i18n key for the label. */
  labelKey: string;
  /**
   * Optional keyboard accelerator (currently macOS-only for tray items).
   * Standard Tauri accelerator string, e.g. `"CmdOrCtrl+Alt+D"`.
   */
  accelerator?: string;
  /** Groups multiple items with dividers between them. */
  section?: "actions" | "navigation" | "system";
}

/**
 * Auto-updater configuration. Tauri's built-in updater polls the
 * `feedUrl`, verifies signatures against the bundled public key, and
 * exposes the download to `updateServiceWorker()`-equivalent JS APIs.
 */
export interface UpdaterConfig {
  enabled: boolean;
  /**
   * URL template of the update manifest. Tauri substitutes
   * `{target}` / `{arch}` / `{current-version}` at request time.
   */
  feedUrl: string;
  /** Poll cadence in milliseconds. 4h default matches DESKTOP_PLAN.md §3. */
  intervalMs: number;
  /**
   * Public key for signature verification. Filled from
   * `TAURI_SIGNING_PUBLIC_KEY` at build time; empty in dev.
   */
  publicKey: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Deep-link URL scheme. Case-insensitive on all three OSes. Registered
 * via `tauri-plugin-deep-link`. See DESKTOP_PLAN.md §4.5 for the route
 * table this scheme drives.
 */
export const DEEP_LINK_SCHEME = "academorix";

/**
 * Global shortcut to raise the app from anywhere on the OS. Overridable
 * from Settings → Desktop. Uses Tauri's cross-platform accelerator
 * string format — `CmdOrCtrl` picks `Cmd` on macOS, `Ctrl` elsewhere.
 */
export const GLOBAL_SHORTCUT = "CmdOrCtrl+Shift+A";

/**
 * Window defaults for the main app window. Users can resize; the
 * final size + position is persisted per OS convention (macOS: NSWindow
 * autosave; Windows: registry; Linux: config file under XDG).
 */
export const WINDOW_DEFAULTS = {
  width: 1440,
  height: 900,
  minWidth: 1024,
  minHeight: 720,
  resizable: true,
  transparent: false,
  /**
   * Custom title-bar on Windows/Linux; native on macOS to keep the
   * traffic-light widgets. Set per-target in `src-tauri/tauri.conf.json`.
   */
  decorations: true,
  /**
   * Focus on launch. False on Tauri deep-link handlers so external URL
   * opens don't steal focus.
   */
  focus: true,
} as const;

/**
 * Tray menu items. Rendered when `desktop.tray.enabled` is on. Localized
 * via the shared message catalog (label keys resolve at menu build time).
 */
export const TRAY_ITEMS: readonly TrayItem[] = [
  { id: "tray.open", labelKey: "desktop.tray.open", section: "actions" },
  { id: "tray.new_athlete", labelKey: "desktop.tray.new_athlete", section: "navigation" },
  { id: "tray.new_session", labelKey: "desktop.tray.new_session", section: "navigation" },
  { id: "tray.check_updates", labelKey: "desktop.tray.check_updates", section: "system" },
  { id: "tray.sign_out", labelKey: "desktop.tray.sign_out", section: "system" },
  { id: "tray.quit", labelKey: "desktop.tray.quit", section: "system" },
] as const;

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

/**
 * Bundled desktop config. `src/desktop/*` imports this; `build.rs`
 * reads it via a JSON serialization step.
 */
export const desktopConfig = {
  app: {
    /** Registered protocol handler for deep links. */
    protocol: DEEP_LINK_SCHEME,
    /** Global shortcut to raise the app. */
    globalShortcut: GLOBAL_SHORTCUT,
  },

  window: {
    default: WINDOW_DEFAULTS,
    /** Persist window position + size across launches. */
    restoreState: true,
    /**
     * On close: `"quit"` closes the process; `"hide"` keeps the tray
     * icon alive. Default matches macOS convention on macOS and
     * quit-on-close elsewhere. Users can toggle in Settings → Desktop.
     */
    closeBehaviour: "quit" as "quit" | "hide",
  },

  tray: {
    enabled: true,
    items: TRAY_ITEMS,
  },

  updater: {
    enabled: true,
    feedUrl: "https://updates.academorix.com/dashboard/{target}/{arch}/{current-version}",
    intervalMs: 4 * 60 * 60 * 1000, // 4h
    publicKey: "",
  } satisfies UpdaterConfig,

  security: {
    /**
     * Drag+drop files onto the window. Off by default — we don't have
     * a drop target UX yet. Flip on when the imports module lands.
     */
    allowFileDrop: false,
    /**
     * URL patterns that `shell.open` will honour. Everything else is
     * silently rejected by the Rust side.
     */
    allowedShellUrls: [
      "https://academorix.com/*",
      "https://academorix.app/*",
      "https://docs.academorix.com/*",
      "mailto:*",
    ] as readonly string[],
  },

  logging: {
    level: "info" as "error" | "warn" | "info" | "debug",
  },
} as const;
