/**
 * @file window.ts
 * @module desktop/window
 *
 * @description
 * Helpers that speak to the current window (the Rust-owned OS window that
 * hosts the webview). Every helper no-ops on the web build.
 *
 * The methods available here map onto Tauri v2's `WebviewWindow` API but
 * hide the dynamic-import boilerplate + error handling so consumers can
 * call them without knowing about `@tauri-apps/api`.
 *
 * @see DESKTOP_PLAN.md §4.1 (window management)
 */

import { isDesktop } from "@/desktop/is-desktop";

/**
 * Set the tab / title-bar title. Called by `DesktopBootstrap` on mount
 * and by every screen that mutates the browser tab title.
 *
 * Web build: falls back to `document.title` mutation, matching the
 * behaviour the SPA already gets from `<DocumentTitleHandler />`.
 */
export async function setWindowTitle(title: string): Promise<void> {
  if (!isDesktop) {
    if (typeof document !== "undefined") document.title = title;

    return;
  }

  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");

    await getCurrentWindow().setTitle(title);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[desktop/window] setTitle(${title}) failed`, err);
  }
}

/**
 * Update the dock/taskbar unread badge. macOS: dock icon overlay.
 * Windows: taskbar. Linux: best-effort (some DEs ignore it).
 *
 * Pass `undefined` or `0` to clear the badge.
 *
 * Web build: no-op.
 */
export async function setBadgeCount(count: number | undefined): Promise<void> {
  if (!isDesktop) return;

  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    // Tauri v2 `setBadgeCount` accepts `undefined` to clear; convert
    // 0/undefined to `undefined` so both call sites work.
    const value = !count || count <= 0 ? undefined : count;

    await getCurrentWindow().setBadgeCount(value);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[desktop/window] setBadgeCount(${count}) failed`, err);
  }
}

/**
 * Minimize the current window to the tray / dock.
 *
 * Web build: no-op.
 */
export async function minimizeWindow(): Promise<void> {
  if (!isDesktop) return;
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");

    await getCurrentWindow().minimize();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[desktop/window] minimize failed", err);
  }
}

/**
 * Bring the current window to the foreground and give it keyboard focus.
 * Fired when a deep link arrives and needs to raise the app.
 *
 * Web build: no-op.
 */
export async function raiseWindow(): Promise<void> {
  if (!isDesktop) return;
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();

    await win.unminimize();
    await win.show();
    await win.setFocus();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[desktop/window] raise failed", err);
  }
}

/**
 * Subscribe to OS-theme changes. The Tauri v2 window emits a `tauri://
 * theme-changed` event whenever the OS scheme flips light/dark. We
 * project that onto a simpler `"light" | "dark"` string for the theme
 * provider.
 *
 * Web build: subscribes to `matchMedia("(prefers-color-scheme: dark)")`
 * instead so the same hook works everywhere.
 */
export function onOsThemeChange(handler: (theme: "light" | "dark") => void): () => void {
  if (!isDesktop) {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return () => {
        /* SSR no-op */
      };
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event: MediaQueryListEvent): void => {
      handler(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }

  let disposed = false;
  let cleanup: () => void = () => {
    disposed = true;
  };

  void import("@tauri-apps/api/window")
    .then(({ getCurrentWindow }) =>
      getCurrentWindow().onThemeChanged((event) => {
        // Tauri v2's payload is `{ payload: "light" | "dark" }`.
        handler(event.payload);
      }),
    )
    .then((unlisten) => {
      if (disposed) {
        unlisten();

        return;
      }
      cleanup = () => {
        disposed = true;
        unlisten();
      };
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[desktop/window] onThemeChanged failed", err);
    });

  return () => cleanup();
}
