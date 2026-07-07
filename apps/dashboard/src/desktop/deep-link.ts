/**
 * @file deep-link.ts
 * @module desktop/deep-link
 *
 * @description
 * Scaffold for the `academorix://` protocol handler wired in Phase 3.
 * The real router will parse incoming URLs and dispatch to React Router
 * via `useNavigate()` (see `DESKTOP_PLAN.md` §4.5 for the route table).
 *
 * Today: every function is a no-op regardless of `isDesktop`. This file
 * exists so consumers can start importing the eventual API surface (the
 * onboarding flow, the marketing site's "Open in Academorix" button)
 * without a follow-up rename when Phase 3 lands.
 */

import { isDesktop } from "@/desktop/is-desktop";

/** Payload delivered by the Rust shell when a deep link arrives. */
export interface DeepLinkPayload {
  /** Full URL as delivered by the OS (e.g. `academorix://workspace/nike`). */
  url: string;
}

/**
 * Subscribe to `academorix://` URLs the OS forwards to the desktop shell.
 * Phase 1/2: no-op. Phase 3: hooked to `tauri-plugin-deep-link`.
 */
export function onDeepLink(_handler: (payload: DeepLinkPayload) => void): () => void {
  if (!isDesktop) {
    return () => {
      /* web build no-op */
    };
  }

  // eslint-disable-next-line no-console
  console.debug("[desktop/deep-link] Phase 3 not yet wired — no-op subscribe");

  return () => {
    /* Phase 3 will attach a real listener */
  };
}
