/**
 * @file index.ts
 * @module desktop
 *
 * @description
 * Public barrel for the desktop-adapter module. Every consumer imports
 * from `@/desktop` — never from a nested path — so the module boundary
 * stays flat and refactor-friendly.
 *
 * Layout is deliberately mirrored to `DESKTOP_PLAN.md` §2.1:
 *
 * - `is-desktop` — runtime feature detection (`isDesktop` constant).
 * - `native-menu` — IPC bridge for the OS menu bar.
 * - `tray` — tray-menu subscribers + badge helpers.
 * - `window` — dock badge, title, theme, raise/minimize.
 * - `deep-link` — Phase 3 scaffold.
 * - `updater` — Phase 4 scaffold.
 * - `notifications` — OS-notification adapter (falls back to browser API).
 * - `welcome-window` — first-run window helper (Phase 3).
 * - `DesktopBootstrap` — provider-tree side-effect component.
 */

export { DesktopBootstrap } from "@/desktop/DesktopBootstrap";
export { isDesktop, isDesktopRuntime } from "@/desktop/is-desktop";
export type { MenuCommandPayload, Unsubscribe } from "@/desktop/native-menu";
export { invokeMenuCommand, notifyLocaleChanged, onMenuCommand } from "@/desktop/native-menu";
export { onTrayCommand, setTrayBadgeCount, setTrayTooltip } from "@/desktop/tray";
export {
  minimizeWindow,
  onOsThemeChange,
  raiseWindow,
  setBadgeCount,
  setWindowTitle,
} from "@/desktop/window";
export { onDeepLink } from "@/desktop/deep-link";
export type { DeepLinkPayload } from "@/desktop/deep-link";
export { checkForUpdates, installUpdateAndRestart } from "@/desktop/updater";
export type { UpdateInfo } from "@/desktop/updater";
export { showNativeNotification } from "@/desktop/notifications";
export type { NativeNotificationOptions } from "@/desktop/notifications";
export { showWelcomeWindow } from "@/desktop/welcome-window";
