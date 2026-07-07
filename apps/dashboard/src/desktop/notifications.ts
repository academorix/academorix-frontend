/**
 * @file notifications.ts
 * @module desktop/notifications
 *
 * @description
 * Native OS notification adapter. See `NOTIFICATIONS_PLAN.md` §7 for the
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
 * itself is owned by `NOTIFICATIONS_PLAN.md` §3 (contextual prompts + a
 * Settings toggle). This adapter never asks — it just refuses to fire
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

import { isDesktop } from "@/desktop/is-desktop";

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
 * Fire an OS notification. Phase 1/2 uses the browser Notification API
 * regardless of surface; Phase 3 will route through the Tauri plugin on
 * desktop for native fidelity.
 *
 * Returns `true` if the notification was scheduled, `false` otherwise
 * (missing permission, unsupported browser, exception).
 */
export async function showNativeNotification(
  title: string,
  options: NativeNotificationOptions = {},
): Promise<boolean> {
  // Phase 3 upgrade path — currently `#[cfg(feature = "phase3")]` on the
  // Rust side, so we route through the browser API today. The plugin
  // import is placed behind an `if (false)` sentinel (kept as a TODO so
  // grepping for "phase3" finds this file) to avoid dead-import churn.
  if (isDesktop) {
    // TODO(phase3): swap to `@tauri-apps/plugin-notification`.
    // const { sendNotification, isPermissionGranted, requestPermission } =
    //   await import("@tauri-apps/plugin-notification");
    // let granted = await isPermissionGranted();
    // if (!granted) granted = (await requestPermission()) === "granted";
    // if (!granted) return false;
    // await sendNotification({ title, body: options.body, icon: options.icon });
    // return true;
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
