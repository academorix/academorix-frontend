/**
 * @file index.ts
 * @module desktop
 *
 * @description
 * Public barrel for the desktop-adapter module. Every consumer imports
 * from `@/lib/desktop` — never from a nested path — so the module boundary
 * stays flat and refactor-friendly.
 *
 * Layout is deliberately mirrored to `DESKTOP_PLAN.md` §2.1:
 *
 * - `is-desktop` — runtime feature detection (`isDesktop` constant).
 * - `native-menu` — IPC bridge + descriptor builder for the OS menu bar.
 * - `tray` — tray-menu subscribers + badge helpers.
 * - `window` — dock badge, title, theme, raise/minimize.
 * - `deep-link` — `academorix://` URL handler + pure resolver.
 * - `shortcut` — global raise-app accelerator wrapper.
 * - `updater` — silent 4h auto-update poller + install-and-restart toast.
 * - `notifications` — OS-notification adapter (falls back to browser API).
 * - `welcome-window` — first-run 480x360 native welcome window helper.
 * - `DesktopBootstrap` — provider-tree side-effect component.
 */

export { DesktopBootstrap } from "@/lib/desktop/DesktopBootstrap";
export { isDesktop, isDesktopRuntime } from "@/lib/desktop/is-desktop";

// -- Native menu --------------------------------------------------------
export type {
  MenuCommandPayload,
  NativeMenuItem,
  NativeMenuSection,
  PermissionResolver,
  Unsubscribe,
} from "@/lib/desktop/native-menu";
export {
  buildNativeMenu,
  invokeMenuCommand,
  MENU_CATEGORY_ORDER,
  notifyLocaleChanged,
  onMenuCommand,
  publishNativeMenu,
} from "@/lib/desktop/native-menu";

// -- Tray + window ------------------------------------------------------
export { onTrayCommand, setTrayBadgeCount, setTrayTooltip } from "@/lib/desktop/tray";
export {
  minimizeWindow,
  onOsThemeChange,
  raiseWindow,
  setBadgeCount,
  setWindowTitle,
} from "@/lib/desktop/window";

// -- Deep links + shortcuts --------------------------------------------
export type { DeepLinkPayload, ResolvedDeepLink } from "@/lib/desktop/deep-link";
export { onDeepLink, resolveDeepLinkPath } from "@/lib/desktop/deep-link";
export type { RegisteredShortcut } from "@/lib/desktop/shortcut";
export { registerGlobalShortcut, unregisterGlobalShortcut } from "@/lib/desktop/shortcut";

// -- Updater ------------------------------------------------------------
export type { UpdateChecker, UpdateInfo } from "@/lib/desktop/updater";
export {
  checkForUpdates,
  installUpdateAndRestart,
  startUpdateChecker,
} from "@/lib/desktop/updater";

// -- Notifications ------------------------------------------------------
export type { NativeNotificationOptions } from "@/lib/desktop/notifications";
export { showNativeNotification } from "@/lib/desktop/notifications";

// -- Welcome window -----------------------------------------------------
export type { WelcomeWindowChoice } from "@/lib/desktop/welcome-window";
export {
  closeWelcomeWindow,
  onWelcomeWindowChoice,
  showWelcomeWindow,
  showWelcomeWindowIfFirstRun,
} from "@/lib/desktop/welcome-window";
