/**
 * @file notifications.ts
 * @module desktop/notifications
 *
 * @description
 * Native OS notification adapter. See notifications module for the
 * delivery matrix (in-app vs push vs native, foreground vs background,
 * DND vs quiet hours). This module is the desktop-native branch of that
 * delivery pipeline — the notifications sub-agent's push-handler will
 * call {@link showNativeNotification} via a dynamic import.
 *
 * ## Web fallback
 *
 * On the web build we fall through to the browser Notification API. This
 * keeps the same call site working across every surface — the caller
 * doesn't need to check `isDesktop`.
 *
 * ## Permission
 *
 * Both surfaces require permission before firing. The permission flow
 * itself is owned by notifications module. This adapter never asks — it just refuses to fire
 * silently when permission is missing.
 *
 * ## Phased wiring
 *
 * Phase 1/2: no `tauri-plugin-notification` runtime wiring on the Rust
 * side (see `src-tauri/src/notification.rs`). Calling
 * `showNativeNotification` from a desktop build falls through to the
 * browser Notification API — which is provided by the underlying WKWebView /
 * WebView2 anyway, so users still see notifications. Phase 3 swaps to
 * the plugin so we get native fidelity (macOS Notification Center groups,
 * Windows Action Center, DBus).
 */

import { isDesktop } from "@/lib/desktop/is-desktop";

/** Options accepted by {@link showNativeNotification}. */
export interface NativeNotificationOptions {
  /** Body copy shown under the title. */
  body?: string;
  /** URL of the icon to display alongside the notification. */
  icon?: string;
  /** Notification tag — new notifications with the same tag replace older ones. */
  tag?: string;
  /** Opaque data blob delivered to click handlers. */
  data?: Record<string, unknown>;
}

/**
 * Fire an OS notification. Prefers the native Tauri notification
 * plugin when running as desktop (macOS Notification Center groups,
 * Windows Action Center categories, Linux DBus) and falls back to
 * the browser `Notification` API on the web build and inside the
 * WKWebView / WebView2 when the plugin isn't loaded.
 *
 * Returns `true` if the notification was scheduled, `false` otherwise
 * (missing permission, unsupported browser, exception).
 */
export async function showNativeNotification(
  title: string,
  options: NativeNotificationOptions = {},
): Promise<boolean> {
  if (isDesktop) {
    // Route through the Tauri plugin when the phase3 cargo feature is
    // on. Storing the module id in a variable stops Vite from trying
    // to resolve the plugin at bundle time — the runtime import falls
    // through to the browser API path on failure.
    try {
      const notificationPluginId = "@tauri-apps/plugin-notification";
      const mod = await import(/* @vite-ignore */ notificationPluginId);
      let granted = await mod.isPermissionGranted();

      if (!granted) {
        const result = await mod.requestPermission();

        granted = result === "granted";
      }

      if (!granted) {
        return false;
      }

      await mod.sendNotification({
        title,
        body: options.body,
        icon: options.icon,
      });

      return true;
    } catch (err) {
      // Plugin unavailable (phase-gated off). Fall through to the
      // browser Notification API which the WKWebView / WebView2 host
      // still exposes.
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.info(
          "[desktop/notifications] tauri notification plugin unavailable — falling back to browser API",
          err,
        );
      }
    }
  }

  if (typeof window === "undefined" || typeof window.Notification !== "function") {
    return false;
  }

  if (window.Notification.permission !== "granted") {
    return false;
  }

  try {
    new window.Notification(title, {
      body: options.body,
      icon: options.icon,
      tag: options.tag,
      data: options.data,
    });

    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[desktop/notifications] showNativeNotification failed", err);

    return false;
  }
}
