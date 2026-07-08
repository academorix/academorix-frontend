/**
 * @file tray.ts
 * @module desktop/tray
 *
 * @description
 * Renderer-side helpers for the system-tray icon. The tray is built and
 * wired entirely in Rust (`src-tauri/src/tray.rs`); this module only
 * exposes:
 *
 * - {@link onTrayCommand} — subscribe to tray-menu clicks (they arrive
 *   via the same `menu-command` event as the native menu bar, so this
 *   is a filtered wrapper around `onMenuCommand`).
 * - {@link setTrayTooltip} — update the tooltip shown when the user
 *   hovers the tray icon (used to display unread notification counts).
 * - {@link setBadgeCount} — update the dock/taskbar badge (macOS: on
 *   the dock icon; Windows: on the taskbar entry; Linux: best effort).
 *
 * Every helper no-ops on the web build.
 */

import { isDesktop } from "@/desktop/is-desktop";
import { onMenuCommand, type MenuCommandPayload, type Unsubscribe } from "@/desktop/native-menu";

/**
 * Subscribe to tray-menu clicks. Convenience wrapper around
 * {@link onMenuCommand} that filters on `source === "tray"`. Returns an
 * unsubscribe function.
 *
 * @example
 * ```ts
 * useEffect(() => onTrayCommand(({ id }) => {
 *   if (id === "tray.sign_out") authProvider.logout();
 * }), []);
 * ```
 */
export function onTrayCommand(handler: (payload: MenuCommandPayload) => void): Unsubscribe {
  return onMenuCommand((payload) => {
    if (payload.source === "tray") handler(payload);
  });
}

/**
 * Update the tray icon tooltip. Common uses: reflect unread notification
 * count ("Academorix — 3 new") or DND state ("Academorix — Do not
 * disturb").
 *
 * Phase 1 stub — Rust listener lands with Phase 2b. Emits the event
 * anyway so the wiring works end-to-end once the listener attaches.
 *
 * Web build: no-op.
 */
export async function setTrayTooltip(tooltip: string): Promise<void> {
  if (!isDesktop) return;
  try {
    const { emit } = await import("@tauri-apps/api/event");

    await emit("tray-tooltip", { tooltip });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[desktop/tray] tray-tooltip emit failed", err);
  }
}

/**
 * Update the dock/taskbar badge count. Wired to the notification
 * queue by {@link "@/desktop/window".setBadgeCount}. Kept separate here
 * so the tray-specific unread badge (a distinct affordance on some
 * platforms) can diverge in the future.
 *
 * Web build: no-op.
 */
export async function setTrayBadgeCount(count: number): Promise<void> {
  if (!isDesktop) return;
  try {
    const { emit } = await import("@tauri-apps/api/event");

    await emit("tray-badge", { count });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[desktop/tray] tray-badge emit failed", err);
  }
}
