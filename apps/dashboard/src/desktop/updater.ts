/**
 * @file updater.ts
 * @module desktop/updater
 *
 * @description
 * Auto-update integration for the Tauri v2 desktop shell. Surfaces a
 * silent background check every 4 hours (see
 * {@link "@/config/desktop.config".desktopConfig.updater.intervalMs})
 * and, when a new version is available, opens the same HeroUI toast
 * the PWA update path uses — repurposed with an "Install and restart"
 * action per DESKTOP_PLAN.md §3 Phase 4.
 *
 * ## Wiring
 *
 * Two entrypoints:
 *
 *  - {@link startUpdateChecker} — mounts a `setInterval` that polls
 *    the manifest URL declared in `desktopConfig.updater.feedUrl`.
 *    Called from `DesktopBootstrap` on mount; returns a stop handle
 *    the caller invokes on unmount.
 *  - {@link checkForUpdates} — one-shot check the "Check for updates"
 *    menu / tray entry calls. Returns the {@link UpdateInfo} when a
 *    new version is available, `null` otherwise.
 *
 * ## Phase gating
 *
 * Requires the `phase4` cargo feature (enabled builds ship signed
 * artifacts). When the feature is off the plugin isn't available;
 * the JS side catches the import failure and logs a dev-only
 * message. That's the correct degradation — an unsigned dev build
 * shouldn't scare the user with a stale "no updates" chrome.
 *
 * ## Signature verification
 *
 * The Tauri updater plugin verifies signatures against
 * `updater.publicKey` at install time. We DO NOT re-verify on the
 * JS side — the plugin's contract guarantees the payload is signed
 * before it hits the disk.
 */

import { toast } from "@academorix/ui/react";

import { desktopConfig } from "@/config/desktop.config";
import { isDesktop } from "@/desktop/is-desktop";

/** Update-available payload; matches the Tauri v2 updater plugin shape. */
export interface UpdateInfo {
  /** The new version number (semver). */
  version: string;
  /** The version currently installed. */
  currentVersion: string;
  /** Optional release notes (Markdown allowed by the plugin). */
  releaseNotes?: string;
  /** ISO-8601 release date. */
  date?: string;
}

/**
 * Fires a single check against the update manifest. Returns the
 * update descriptor when an update is available OR `null` when the
 * app is up-to-date / the plugin isn't loaded.
 *
 * Web build: always `null`. Silent by design — the caller decides
 * whether to surface a toast.
 */
export async function checkForUpdates(): Promise<UpdateInfo | null> {
  if (!isDesktop) return null;

  try {
    // `@vite-ignore` + variable prevents Vite from resolving the
    // plugin at bundle time — the updater plugin is only installed
    // when the `phase4` cargo feature is on.
    const updaterId = "@tauri-apps/plugin-updater";
    const { check } = await import(/* @vite-ignore */ updaterId);
    const update = await check();

    if (update === null) {
      // No new version — no toast.
      return null;
    }

    // Cache the update handle in a module-scoped slot so
    // `installUpdateAndRestart` can call `downloadAndInstall` without
    // re-fetching the manifest.
    pendingUpdateHandle = update;

    return {
      version: update.version,
      currentVersion: update.currentVersion,
      releaseNotes: update.body ?? undefined,
      date: update.date ?? undefined,
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      // Give dev a hint — usually the phase4 cargo feature is off.
      // eslint-disable-next-line no-console
      console.info("[desktop/updater] update check skipped", err);
    }

    return null;
  }
}

/**
 * Module-scoped handle to the last discovered update. Populated by
 * {@link checkForUpdates} on success so
 * {@link installUpdateAndRestart} can dispatch to the plugin without
 * re-fetching the manifest. The plugin's `Update` type is exported
 * via `tauri-plugins.d.ts` and we hold on to it opaquely — we only
 * call `downloadAndInstall`.
 */
type PluginUpdateHandle = {
  version: string;
  currentVersion: string;
  body?: string;
  date?: string;
  downloadAndInstall: () => Promise<void>;
};

let pendingUpdateHandle: PluginUpdateHandle | null = null;

/**
 * Download + install the pending update, then restart the app.
 * Called from the update toast's "Install and restart" action.
 *
 * Web build: no-op. When called without a pending update handle the
 * function re-checks first — the toast is intentionally
 * dismissible, and the user could restart the app between the toast
 * fire and their click.
 */
export async function installUpdateAndRestart(): Promise<void> {
  if (!isDesktop) return;

  try {
    let handle = pendingUpdateHandle;

    if (handle === null) {
      const updaterId = "@tauri-apps/plugin-updater";
      const { check } = await import(/* @vite-ignore */ updaterId);

      handle = await check();
    }

    if (handle === null) {
      return;
    }

    // Downloads + installs the update payload. The plugin verifies
    // the Ed25519 signature before writing to disk.
    await handle.downloadAndInstall();

    // Relaunch to load the new binary. The plugin re-executes the
    // desktop app with the new build.
    const processId = "@tauri-apps/plugin-process";
    const { relaunch } = await import(/* @vite-ignore */ processId);

    await relaunch();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[desktop/updater] install-and-restart failed", err);
  }
}

// ---------------------------------------------------------------------------
// Toast surface (repurposed from the PWA update flow)
// ---------------------------------------------------------------------------

/**
 * Fires the "Update available" toast with an "Install and restart"
 * action button. Same UX affordance the PWA path uses (see
 * `src/pwa/pwa-update-toast.tsx`) so users flip between builds
 * without a mental context switch.
 *
 * @param info - The update descriptor to render in the description.
 */
function surfaceUpdateToast(info: UpdateInfo): void {
  toast("Update available", {
    variant: "accent",
    // Persist the toast — the user should choose consciously per
    // DESKTOP_PLAN.md §3 (Phase 4). Same behavior as the PWA path.
    timeout: 0,
    description: `A newer version of Academorix (${info.version}) is ready to install.`,
    actionProps: {
      children: "Install and restart",
      onPress: () => {
        void installUpdateAndRestart();
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Background poller
// ---------------------------------------------------------------------------

/**
 * Result of {@link startUpdateChecker}. Call `stop()` on unmount to
 * clear the interval.
 */
export interface UpdateChecker {
  /** Cadence (ms) between checks. */
  intervalMs: number;
  /** Cancel the background poll + clear pending handles. */
  stop: () => void;
}

/**
 * Kicks off a silent background poll for updates. Fires immediately
 * once (so the user gets prompt feedback on launch if an update is
 * already staged) and then every `desktopConfig.updater.intervalMs`
 * — 4h by default.
 *
 * When an update is discovered, surfaces the toast with the
 * "Install and restart" action. Suppresses further toasts for the
 * SAME version so the user isn't nagged every 4h with the same
 * banner.
 *
 * Web build: returns a no-op stop handle so callers can treat the
 * return value uniformly across surfaces.
 */
export function startUpdateChecker(): UpdateChecker {
  if (!isDesktop || !desktopConfig.updater.enabled) {
    return {
      intervalMs: desktopConfig.updater.intervalMs,
      stop: () => {
        /* no-op */
      },
    };
  }

  let lastPromptedVersion: string | null = null;

  const runCheck = async (): Promise<void> => {
    const info = await checkForUpdates();

    if (info === null) {
      return;
    }

    if (info.version === lastPromptedVersion) {
      // Already prompted this version — don't re-toast until the
      // user dismisses or the next release lands.
      return;
    }

    lastPromptedVersion = info.version;
    surfaceUpdateToast(info);
  };

  // Fire immediately so a user launching an already-outdated build
  // gets the prompt without waiting 4h.
  void runCheck();

  const handle = window.setInterval(() => {
    void runCheck();
  }, desktopConfig.updater.intervalMs);

  return {
    intervalMs: desktopConfig.updater.intervalMs,
    stop: () => {
      window.clearInterval(handle);
    },
  };
}
