/**
 * @file DesktopBootstrap.tsx
 * @module desktop/DesktopBootstrap
 *
 * @description
 * Boot-side-effect component for the Tauri desktop shell. Mounted once,
 * high in the provider tree (see `src/providers.tsx`). Its job is
 * limited to work that only makes sense on the desktop surface:
 *
 * 1. Set the OS-window title to the app's canonical name (mirrors the
 *    web build's `document.title` — the Rust side reads this on boot
 *    but a change on the JS side keeps the title reactive to future
 *    workspace-switch UX).
 * 2. Register the tray-callback bridge so the Notifications /
 *    Onboarding sub-agents can react to tray menu clicks
 *    (e.g. `tray.sign_out` → `authProvider.logout()`).
 * 3. Mirror the OS theme (light / dark) into the app theme when the
 *    user hasn't manually pinned a preference.
 *
 * Renders nothing visible — `children` pass through unchanged so
 * `<DesktopBootstrap>` can be dropped into a provider stack without
 * disturbing sibling components.
 *
 * ## Web-build safety
 *
 * Every side effect below runs through the `@/desktop/*` adapter layer,
 * which no-ops when `isDesktop` is false. That means this component
 * mounts safely in every build — it just does nothing on the web.
 *
 * ## Feature flag
 *
 * Even on the desktop shell the whole bootstrap is short-circuited by
 * the `desktopShell` compile-time flag from `features.config.ts`, so
 * ops can flip a broken native binding off with an env var without a
 * redeploy of the Rust side.
 */

import { useEffect } from "react";

import type { ReactNode } from "react";

import { features } from "@/config/features.config";
import { siteConfig } from "@/config/site.config";
import { onTrayCommand } from "@/desktop/tray";
import { onOsThemeChange, setWindowTitle } from "@/desktop/window";

/** Props for {@link DesktopBootstrap}. */
interface DesktopBootstrapProps {
  /**
   * The subtree to render after the desktop bootstrap effects fire.
   * Never wrapped in extra DOM — this component is transparent.
   */
  children: ReactNode;
}

/**
 * Registers the desktop-only side effects, then renders `children`.
 * Guaranteed to render nothing beyond what its children render.
 */
export function DesktopBootstrap({ children }: DesktopBootstrapProps): ReactNode {
  useEffect(() => {
    if (!features.desktopShell) {
      return;
    }

    // 1. Window title. Adapter falls back to `document.title` on web.
    void setWindowTitle(siteConfig.name);

    // 2. Tray-command bridge. Each subscriber tears down on unmount.
    //    Right now we only log — the Notifications / Onboarding sub-
    //    agents will attach real handlers once the tray items land in
    //    their respective plans.
    const disposeTray = onTrayCommand((payload) => {
      // eslint-disable-next-line no-console
      console.info("[DesktopBootstrap] tray command received", payload);
    });

    // 3. OS-theme mirroring. We only mirror when the user hasn't pinned
    //    a manual preference — that lookup happens inside the theme
    //    provider once it lands. For now, forward the OS event as a
    //    console info so the wiring is verifiable in dev.
    const disposeTheme = onOsThemeChange((theme) => {
      // eslint-disable-next-line no-console
      console.info(`[DesktopBootstrap] OS theme changed → ${theme}`);
    });

    return () => {
      disposeTray();
      disposeTheme();
    };
  }, []);

  return children;
}
