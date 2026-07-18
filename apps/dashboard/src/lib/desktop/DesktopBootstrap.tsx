/**
 * @file DesktopBootstrap.tsx
 * @module desktop/DesktopBootstrap
 *
 * @description
 * Boot-side-effect component for the Tauri desktop shell. Mounted once,
 * high in the provider tree (see `src/providers.tsx`). On mount it wires
 * every desktop-only integration described in DESKTOP_PLAN.md §3:
 *
 *  1. Set the OS-window title to the app's canonical name.
 *  2. Publish the native menu descriptor to the Rust shell (built
 *     from `menuCommands`, filtered by surfaces + permissions + the
 *     `isVisible` predicate).
 *  3. Register the tray-callback bridge so the Notifications /
 *     Onboarding sub-agents can react to tray menu clicks.
 *  4. Register the OS-wide raise-app shortcut (`Cmd/Ctrl+Shift+A` by
 *     default, configurable via `desktopConfig.app.globalShortcut`).
 *  5. Register the `academorix://` deep-link handler and route
 *     incoming URLs through React Router's `useNavigate()`.
 *  6. Subscribe to the OS `theme-changed` event and mirror it into
 *     HeroUI's dark-mode toggle.
 *  7. Start the auto-update poller (silent check every 4h, surfaces
 *     the "Install and restart" toast when a new version is ready).
 *  8. Ask the shell to raise the first-run welcome window when
 *     `desktopState.welcomeShownAt` is null.
 *
 * Renders nothing visible — `children` pass through unchanged so
 * `<DesktopBootstrap>` can be dropped into a provider stack without
 * disturbing sibling components.
 *
 * ## Web-build safety
 *
 * Every side effect runs through the `@/lib/desktop/*` adapter layer,
 * which no-ops when `isDesktop` is false. That means this component
 * mounts safely in every build — it just does nothing on the web.
 *
 * ## Feature flag
 *
 * The whole bootstrap is short-circuited by the `desktopShell`
 * compile-time flag from `features.config.ts`, so ops can flip a
 * broken native binding off with an env var without a redeploy of
 * the Rust side.
 *
 * ## Rust-side coordination
 *
 * The shell (`src-tauri/src/lib.rs`) exposes its side of every wire
 * event this component uses. Phase 3+ features (deep-link handler,
 * global shortcut plugin) sit behind the `phase3` cargo feature and
 * fall through to no-ops when disabled — the JS side catches the
 * plugin-missing error and continues.
 */

import { useGetIdentity } from "@refinedev/core";
import { useEffect, useRef } from "react";

import type { Identity } from "@/types";
import type { ReactNode } from "react";

import { features } from "@/config/features.config";
import { siteConfig } from "@/config/site.config";
import { onDeepLink, resolveDeepLinkPath } from "@/lib/desktop/deep-link";
import { isDesktop } from "@/lib/desktop/is-desktop";
import { buildNativeMenu, onMenuCommand, publishNativeMenu } from "@/lib/desktop/native-menu";
import { registerGlobalShortcut } from "@/lib/desktop/shortcut";
import { onTrayCommand } from "@/lib/desktop/tray";
import { startUpdateChecker } from "@/lib/desktop/updater";
import { showWelcomeWindowIfFirstRun } from "@/lib/desktop/welcome-window";
import { onOsThemeChange, raiseWindow, setWindowTitle } from "@/lib/desktop/window";

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
  const { data: identity } = useGetIdentity<Identity>();

  /**
   * Guard so a Strict-Mode re-mount doesn't double-register every
   * subsystem. The `useRef` holds the mount ID that fired the
   * effects; the cleanup callback wipes it so subsequent mounts
   * can re-register (e.g. after a hot-reload in dev).
   */
  const hasRunBootRef = useRef(false);

  // ---- Static bootstrap (mount once) ------------------------------------
  //
  // The empty-deps effect runs once on mount + once on unmount. Every
  // integration below is self-cleaning: the returned disposer stops
  // the corresponding subsystem so a route-driven remount doesn't leak
  // event listeners or plugin registrations.
  useEffect(() => {
    if (!features.desktopShell) {
      return;
    }

    if (hasRunBootRef.current) {
      return;
    }

    hasRunBootRef.current = true;

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

    // 3. OS-theme mirroring. The theme provider (once mounted)
    //    listens for CustomEvent('academorix:os-theme-change') on
    //    window; we forward the event so it can decide whether to
    //    honour the OS or the user override.
    const disposeTheme = onOsThemeChange((theme) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("academorix:os-theme-change", { detail: theme }));
      }
    });

    // 4. Native menu-command dispatch. Wires the RUST-side event
    //    stream to a placeholder that logs; the Menus sub-agent will
    //    swap in its command registry via a Phase 2b handoff.
    const disposeMenuCommand = onMenuCommand((payload) => {
      // eslint-disable-next-line no-console
      console.info(`[DesktopBootstrap] menu command '${payload.id}' from ${payload.source}`);
    });

    // 5. Deep-link handler. Every academorix:// URL the OS forwards
    //    to the shell routes into the app — `academorix://workspace/
    //    nike/dashboard` becomes an in-app path the router picks up.
    //
    //    ## Why `window.location.assign` (not `useNavigate`)
    //
    //    `DesktopBootstrap` mounts INSIDE `<Providers>` but OUTSIDE
    //    `<StackraRoutingProvider>` — the routing context isn't
    //    available at this level, so calling `useNavigate()` from
    //    `@stackra/routing/react` throws at render time. Full-page
    //    navigation is the correct primitive for a deep-link
    //    handler anyway: the OS just handed us a URL that the SPA
    //    should boot into fresh. `assign` preserves the browser's
    //    history stack; `raiseWindow` above still fires so the
    //    behaviour is "same window, new route".
    const disposeDeepLink = onDeepLink((payload) => {
      const resolved = resolveDeepLinkPath(payload.url);

      if (!resolved.handled) {
        // eslint-disable-next-line no-console
        console.warn(`[DesktopBootstrap] unknown deep link: ${payload.url}`);

        return;
      }

      // Raise the window BEFORE navigating so a "same window,
      // different route" behaviour lands cleanly on all three OSes.
      void raiseWindow();
      if (typeof window !== "undefined") {
        window.location.assign(resolved.path);
      }
    });

    // 6. Auto-updater. Polls every 4h (see `desktopConfig.updater`).
    const updateChecker = startUpdateChecker();

    // 7. Global raise-app shortcut. Wire the plugin + register the
    //    accelerator. Falls through to a no-op when the phase3
    //    plugin isn't loaded.
    let disposeShortcut: (() => Promise<void>) | null = null;

    void registerGlobalShortcut().then((registration) => {
      disposeShortcut = registration.dispose;
    });

    return () => {
      disposeTray();
      disposeTheme();
      disposeMenuCommand();
      disposeDeepLink();
      updateChecker.stop();
      if (disposeShortcut) {
        void disposeShortcut();
      }
      hasRunBootRef.current = false;
    };
    // Empty dependency list is intentional — every consumer of
    // `navigate` etc. is stable per-mount, and we want the effect to
    // fire exactly once. Re-mounts (Strict Mode) are guarded by
    // `hasRunBootRef` above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Identity-driven bootstrap ----------------------------------------
  //
  // The native menu depends on the identity's permissions (commands
  // filter on `requires`). Republish whenever the identity resolves so
  // the menu bar reflects the current user's access.
  useEffect(() => {
    if (!features.desktopShell || !isDesktop) {
      return;
    }

    // Permissions from the identity, or the empty set on
    // pre-auth (login screen). Superusers (`permissions: ["*"]`)
    // pass every check.
    const permissions = identity?.permissions ?? [];
    const hasPermission = (permission: string): boolean => {
      return permissions.includes("*") || permissions.includes(permission);
    };

    // The translator falls back to the config key when a message
    // is missing. We keep it simple — the shell only cares about
    // the resolved string. A future locale swap emits
    // `locale-changed` so the shell rebuilds via a fresh publish.
    const translate = (key: string, fallback?: string): string => fallback ?? key;

    const sections = buildNativeMenu(translate, { hasPermission });

    void publishNativeMenu(sections);
  }, [identity]);

  // ---- Welcome window (identity-optional; keyed by userId) --------------
  //
  // Fires the native welcome window on first Tauri launch. Runs after
  // the identity resolves so the welcomeShownAt marker is keyed to the
  // signed-in user (namespaced by `namespaceKey` inside the storage
  // helper). Anonymous launches use the `"anon"` bucket.
  useEffect(() => {
    if (!features.desktopShell || !isDesktop) {
      return;
    }

    const userId = identity?.id ?? null;

    void showWelcomeWindowIfFirstRun(userId);
  }, [identity]);

  return children;
}
