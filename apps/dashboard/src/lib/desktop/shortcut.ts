/**
 * @file shortcut.ts
 * @module desktop/shortcut
 *
 * @description
 * Renderer-side wrapper for the OS-wide raise-app shortcut
 * (`Cmd/Ctrl+Shift+A` by default — configurable via
 * {@link "@/config/desktop.config".GLOBAL_SHORTCUT}). Ships a thin
 * `registerGlobalShortcut` / `unregisterGlobalShortcut` pair the
 * `DesktopBootstrap` calls on mount + unmount.
 *
 * The Rust shell owns the actual key trap via
 * `tauri-plugin-global-shortcut`. The renderer's job is to:
 *
 *  1. Ask the Rust shell to register the accelerator (via
 *     `plugin:global-shortcut|register` — the plugin exposes this
 *     command since v2).
 *  2. Subscribe to the plugin's `shortcut` event so we know when the
 *     user hit the combo. On desktop we simply raise the window;
 *     the callback is exposed so a caller can add extra behaviour
 *     (analytics event, telemetry).
 *
 * ## Phase gating
 *
 * The Rust plugin lives behind the `phase3` cargo feature (see
 * `apps/dashboard/src-tauri/Cargo.toml`). When the feature is off the
 * plugin isn't registered — invoking against it fails silently. The
 * JS side catches the exception and continues, so the desktop shell
 * still boots even without the plugin.
 *
 * @see DESKTOP_PLAN.md §3 (Phase 3), §4.3 (integration).
 */

import { GLOBAL_SHORTCUT } from "@/config/desktop.config";
import { isDesktop } from "@/desktop/is-desktop";
import { raiseWindow } from "@/desktop/window";

/**
 * Result of {@link registerGlobalShortcut}. `dispose` cleanly
 * unregisters the accelerator on unmount + tears down the event
 * listener. Idempotent.
 */
export interface RegisteredShortcut {
  /** The accelerator that was registered (post-normalisation). */
  accelerator: string;
  /**
   * Unsubscribes the event listener and unregisters the accelerator
   * from the plugin. Safe to call multiple times.
   */
  dispose: () => Promise<void>;
}

/**
 * Registers the OS-wide raise-app accelerator + returns a disposer.
 * No-ops on the web build.
 *
 * @param onFire - Optional callback fired when the user hits the
 *   accelerator. If omitted we just raise the main window (the plan's
 *   default behaviour — DESKTOP_PLAN.md §3.3).
 * @param accelerator - Override the config's default. Rarely needed
 *   outside tests.
 */
export async function registerGlobalShortcut(
  onFire?: () => void,
  accelerator: string = GLOBAL_SHORTCUT,
): Promise<RegisteredShortcut> {
  const noop: RegisteredShortcut = {
    accelerator,
    dispose: async () => {
      /* web / phase-gated no-op */
    },
  };

  if (!isDesktop) return noop;

  try {
    // Dynamic imports so the web bundle never touches the plugin's
    // JS surface. The plugin package is only present when the
    // `phase3` cargo feature is on. Storing the module id in a
    // variable stops Vite's static import analyser from trying to
    // resolve it at bundle time.
    const pluginId = "@tauri-apps/plugin-global-shortcut";
    const { register, unregister } = await import(/* @vite-ignore */ pluginId);

    // Callback fires ONCE per keydown event; the plugin dedupes
    // repeats. Wire the default raise-window behaviour + let the
    // caller layer additional side effects on top.
    await register(accelerator, () => {
      void raiseWindow();
      onFire?.();
    });

    return {
      accelerator,
      dispose: async () => {
        try {
          await unregister(accelerator);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(`[desktop/shortcut] unregister(${accelerator}) failed`, err);
        }
      },
    };
  } catch (err) {
    // Plugin isn't registered (phase-gated off). Fall through to the
    // no-op so callers can keep their `useEffect` cleanup uniform.
    // eslint-disable-next-line no-console
    console.info(
      `[desktop/shortcut] global-shortcut plugin unavailable (phase-gated?); skipping ${accelerator}`,
      err,
    );

    return noop;
  }
}

/**
 * Unregister an accelerator without going through the disposer. Rare
 * — most callers should hold on to the `RegisteredShortcut.dispose`
 * returned by {@link registerGlobalShortcut}. Exposed so the Settings
 * → Desktop UX (Phase 3+) can revoke a user override.
 */
export async function unregisterGlobalShortcut(
  accelerator: string = GLOBAL_SHORTCUT,
): Promise<void> {
  if (!isDesktop) return;

  try {
    // `@vite-ignore` + variable prevents Vite from resolving the
    // plugin at bundle time — it's only installed when the `phase3`
    // cargo feature is on.
    const pluginId = "@tauri-apps/plugin-global-shortcut";
    const { unregister } = await import(/* @vite-ignore */ pluginId);

    await unregister(accelerator);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[desktop/shortcut] unregister(${accelerator}) failed`, err);
  }
}
