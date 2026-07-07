/**
 * @file welcome-window.ts
 * @module desktop/welcome-window
 *
 * @description
 * First-run experience helper — asks the Rust shell to raise a welcome
 * window with the onboarding tour scene. Phase 1/2: fires the
 * `welcome-window-requested` IPC event so the wiring can be verified
 * end-to-end; Phase 3 puts a real window handler on the Rust side (see
 * `src-tauri/src/lib.rs::setup_ipc_listeners`).
 *
 * @see ONBOARDING_PLAN.md
 * @see DESKTOP_PLAN.md §3 (Phase 3)
 */

import { isDesktop } from "@/desktop/is-desktop";

/**
 * Ask the shell to raise / focus a welcome window. Phase 1/2: emits the
 * IPC event; Rust listener logs and returns. Phase 3: opens a dedicated
 * `WebviewWindow` positioned above the main window.
 *
 * Web build: no-op.
 */
export async function showWelcomeWindow(): Promise<void> {
  if (!isDesktop) return;

  try {
    const { emit } = await import("@tauri-apps/api/event");

    await emit("welcome-window-requested", {});
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[desktop/welcome-window] emit failed", err);
  }
}
