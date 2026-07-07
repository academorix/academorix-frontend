/**
 * @file tauri-plugins.d.ts
 * @module desktop/tauri-plugins
 *
 * @description
 * Ambient module declarations for the Tauri v2 plugin packages the
 * desktop adapters dynamically import at runtime. These packages are
 * only present when the corresponding cargo feature is enabled
 * (`phase3` for deep-link + global-shortcut + notification, `phase4`
 * for the updater); the SPA build reaches for them via dynamic
 * `import(...)` and catches the resolution failure at runtime.
 *
 * Without these ambient declarations, `tsc` would complain about
 * missing module types even for a `void import("@tauri-apps/plugin-x")`
 * expression that never runs on the web build. We ship the type shapes
 * the adapters use (deliberately narrow — a full mirror of each
 * plugin's API would drift from the upstream package the moment it
 * bumps).
 *
 * When the plugins land in `pnpm-workspace.yaml`'s catalog:
 *
 *  1. Add them to `apps/dashboard/package.json` as optional deps.
 *  2. Delete the corresponding `declare module` block below.
 *  3. Run `pnpm typecheck` to confirm the upstream types apply.
 */

// ---------------------------------------------------------------------------
// @tauri-apps/plugin-global-shortcut
// ---------------------------------------------------------------------------
declare module "@tauri-apps/plugin-global-shortcut" {
  /**
   * Register a global accelerator. `handler` fires on every keydown
   * that matches the combo. Resolves once the OS has confirmed the
   * registration.
   */
  export function register(shortcut: string, handler: (accelerator: string) => void): Promise<void>;

  /** Unregister a previously-registered accelerator. */
  export function unregister(shortcut: string): Promise<void>;

  /** Unregister every accelerator this app registered. */
  export function unregisterAll(): Promise<void>;

  /** Query whether an accelerator is registered by this app. */
  export function isRegistered(shortcut: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// @tauri-apps/plugin-deep-link
// ---------------------------------------------------------------------------
declare module "@tauri-apps/plugin-deep-link" {
  /**
   * Register a callback for `academorix://` URLs the OS forwards to
   * the running app. Resolves with an unsubscribe function.
   */
  export function onOpenUrl(handler: (urls: readonly string[]) => void): Promise<() => void>;

  /** Get the URL that launched the app on cold start, if any. */
  export function getCurrent(): Promise<string[] | null>;
}

// ---------------------------------------------------------------------------
// @tauri-apps/plugin-notification
// ---------------------------------------------------------------------------
declare module "@tauri-apps/plugin-notification" {
  export interface NotificationPayload {
    title: string;
    body?: string;
    icon?: string;
    sound?: string;
    schedule?: unknown;
  }

  /** Check whether notification permission has been granted. */
  export function isPermissionGranted(): Promise<boolean>;

  /**
   * Prompt the OS for notification permission. Resolves with the
   * user's choice: `"granted"`, `"denied"`, or `"default"` (dismissed).
   */
  export function requestPermission(): Promise<"granted" | "denied" | "default">;

  /** Fire a notification through the OS-native notification service. */
  export function sendNotification(payload: NotificationPayload): Promise<void>;
}

// ---------------------------------------------------------------------------
// @tauri-apps/plugin-updater
// ---------------------------------------------------------------------------
declare module "@tauri-apps/plugin-updater" {
  /**
   * Update handle returned by {@link check} when a new version is
   * available. Kept intentionally narrow — the adapters only use the
   * fields declared here.
   */
  export interface Update {
    version: string;
    currentVersion: string;
    body?: string;
    date?: string;
    downloadAndInstall(): Promise<void>;
  }

  /**
   * Fires a single update check against the configured manifest URL.
   * Resolves with the update handle when a new version is available
   * OR `null` when the app is up to date.
   */
  export function check(): Promise<Update | null>;
}

// ---------------------------------------------------------------------------
// @tauri-apps/plugin-process
// ---------------------------------------------------------------------------
declare module "@tauri-apps/plugin-process" {
  /**
   * Exit the current process and immediately relaunch. Used by the
   * updater plugin after a successful install to boot the freshly-
   * installed binary.
   */
  export function relaunch(): Promise<void>;

  /** Exit the process with the given status code (default `0`). */
  export function exit(code?: number): Promise<void>;
}
