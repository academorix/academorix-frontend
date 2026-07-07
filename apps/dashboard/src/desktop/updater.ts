/**
 * @file updater.ts
 * @module desktop/updater
 *
 * @description
 * Scaffold for the Phase 4 auto-updater. The real implementation will
 * poll the manifest URL declared in
 * `apps/dashboard/src/config/desktop.config.ts` (`updater.feedUrl`),
 * verify signatures against the bundled public key, and surface the
 * existing PWA update toast (`src/pwa/pwa-update-toast.tsx`) with an
 * "Install and restart" action.
 *
 * Phase 1/2: every function is a no-op stub. Consumers can start
 * importing the eventual API today so Phase 4 lands as a one-file swap.
 *
 * @see DESKTOP_PLAN.md §3 (Phase 4) + DESKTOP_OPS.md
 */

import { isDesktop } from "@/desktop/is-desktop";

/** Update-available payload; matches the Tauri v2 updater plugin shape. */
export interface UpdateInfo {
  version: string;
  currentVersion: string;
  releaseNotes?: string;
  date?: string;
}

/**
 * Trigger a manual update check. Phase 4 wires this to
 * `tauri-plugin-updater`; today it just logs.
 *
 * Web build: no-op returning `null`.
 */
export async function checkForUpdates(): Promise<UpdateInfo | null> {
  if (!isDesktop) return null;
  // eslint-disable-next-line no-console
  console.debug("[desktop/updater] Phase 4 not yet wired — checkForUpdates no-op");

  return null;
}

/**
 * Download + install the pending update, then restart the app. Called
 * from the update toast's "Install and restart" action. Phase 4 fills
 * in the plugin call.
 */
export async function installUpdateAndRestart(): Promise<void> {
  if (!isDesktop) return;
  // eslint-disable-next-line no-console
  console.debug("[desktop/updater] Phase 4 not yet wired — installUpdateAndRestart no-op");
}
