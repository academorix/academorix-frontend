/**
 * @file welcome-window.ts
 * @module desktop/welcome-window
 *
 * @description
 * Coordinates the first-run 480x360 native welcome window for the
 * Tauri desktop shell. On the first launch of the desktop app the
 * Rust side raises a compact window with the brand mark and two
 * buttons: `Sign in` / `Create a workspace` (see ONBOARDING_PLAN.md
 * §7 and DESKTOP_PLAN.md §3 — Phase 3).
 *
 * The JS side of this handshake is minimal:
 *
 *  1. On boot, check the persisted {@link readDesktopState} — if
 *     `welcomeShownAt` is null, the user hasn't been welcomed yet.
 *  2. Emit `welcome-window-requested` so the Rust listener opens
 *     the window (see `src-tauri/src/lib.rs::setup_ipc_listeners`).
 *  3. Persist `welcomeShownAt` so we never re-open on subsequent
 *     launches — the window is one-shot.
 *  4. Listen for the `welcome-window-choice` event the shell fires
 *     when the user picks a button (`"sign-in"` | `"create-workspace"`).
 *     - `sign-in`: closes the welcome window; the SPA is already
 *       loaded behind it so no navigation is needed.
 *     - `create-workspace`: closes the welcome window AND opens the
 *       marketing site's create-workspace form in the default
 *       browser (avoids embedding signup inside the desktop app).
 *
 * ## Web-build safety
 *
 * Every function no-ops on the web build (both the emit and the
 * persistence read). The `showWelcomeWindowIfFirstRun` entry is
 * safe to invoke unconditionally.
 *
 * @see DESKTOP_PLAN.md §3 (Phase 3)
 * @see ONBOARDING_PLAN.md §7 (Desktop-specific first-run)
 */

import { envConfig } from "@/config/env.config";
import { ONBOARDING_SCHEMA_VERSION, onboardingConfig } from "@/config/onboarding.config";
import { isDesktop } from "@/desktop/is-desktop";
import { readDesktopState, writeDesktopState } from "@/onboarding/storage";

/** Button ids the welcome window can fire back. */
export type WelcomeWindowChoice = "sign-in" | "create-workspace";

/**
 * Ask the shell to raise / focus a welcome window. Phase 1/2: emits
 * the IPC event; Rust listener logs and returns. Phase 3: opens the
 * dedicated `WebviewWindow` sized 480x360.
 *
 * Web build: no-op.
 */
export async function showWelcomeWindow(): Promise<void> {
  if (!isDesktop) return;

  try {
    const { emit } = await import("@tauri-apps/api/event");

    await emit("welcome-window-requested", {
      // Rust listener uses the marketing URL to open the correct
      // "Create workspace" destination on button click.
      createWorkspaceUrl: `${envConfig.marketingUrl}/create-workspace?source=desktop`,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[desktop/welcome-window] emit failed", err);
  }
}

/**
 * Close the welcome window, no-op on web. Fired after the user picks
 * either button — the SPA doesn't need the window anymore.
 */
export async function closeWelcomeWindow(): Promise<void> {
  if (!isDesktop) return;

  try {
    const { emit } = await import("@tauri-apps/api/event");

    await emit("welcome-window-close-requested", {});
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[desktop/welcome-window] close-request emit failed", err);
  }
}

/**
 * Subscribe to the user's button choice. Returns an unsubscribe
 * function. Fired at most once per welcome window session; safe to
 * unsubscribe after the first fire.
 */
export function onWelcomeWindowChoice(handler: (choice: WelcomeWindowChoice) => void): () => void {
  if (!isDesktop) return () => {};

  let disposed = false;
  let cleanup: () => void = () => {
    disposed = true;
  };

  void import("@tauri-apps/api/event")
    .then(({ listen }) =>
      listen<{ choice: WelcomeWindowChoice }>("welcome-window-choice", (event) =>
        handler(event.payload.choice),
      ),
    )
    .then((unlisten) => {
      if (disposed) {
        unlisten();

        return;
      }
      cleanup = () => {
        disposed = true;
        unlisten();
      };
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[desktop/welcome-window] listen failed", err);
    });

  return () => cleanup();
}

/**
 * Idempotent first-run entry. Called from `DesktopBootstrap` on
 * mount. Only fires the welcome window when:
 *
 *  - Running inside the Tauri shell.
 *  - `desktop.showWelcomeWindow` config flag is on.
 *  - No `welcomeShownAt` in localStorage (first launch).
 *
 * Persists `welcomeShownAt` before the emit so a duplicate mount
 * (Strict Mode / provider remount) can't re-open the window.
 */
export async function showWelcomeWindowIfFirstRun(userId: string | null): Promise<void> {
  if (!isDesktop) return;
  if (!onboardingConfig.desktop.showWelcomeWindow) return;

  const state = readDesktopState(userId);

  if (state.welcomeShownAt !== null) {
    return;
  }

  // Persist BEFORE emit so a rapid re-mount can't double-fire.
  const now = new Date().toISOString();

  writeDesktopState(userId, {
    ...state,
    welcomeShownAt: now,
    version: ONBOARDING_SCHEMA_VERSION,
  });

  await showWelcomeWindow();
}
