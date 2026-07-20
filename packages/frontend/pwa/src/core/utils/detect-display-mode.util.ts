/**
 * @file detect-display-mode.util.ts
 * @module @stackra/pwa/core/utils
 * @description SSR-safe display-mode detection for the PWA runtime.
 */

import type { PwaDisplayMode } from "../interfaces";

/**
 * Detect the current display mode via `matchMedia`.
 *
 * Falls back to `'browser'` in any of the following cases:
 * - `window` is undefined (SSR / Node).
 * - `matchMedia` is undefined (very old browsers).
 * - No `display-mode` media query matches (defensive default).
 *
 * @returns One of `'browser'`, `'standalone'`, `'minimal-ui'`,
 *   `'fullscreen'`, or `'twa'`.
 */
export function detectDisplayMode(): PwaDisplayMode {
  // SSR-safe short-circuit — `window` is undefined on the server.
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "browser";
  }

  // `navigator.standalone` is Safari's legacy signal; treated as
  // standalone. We check it AFTER the media queries so a proper
  // `standalone` matchMedia result wins.
  if (window.matchMedia("(display-mode: standalone)").matches) {
    // Trusted Web Activity (Android) — recognisable via the "wv"
    // WebView hint plus the standalone matchMedia result.
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.userAgent === "string" &&
      navigator.userAgent.includes("wv")
    ) {
      return "twa";
    }
    return "standalone";
  }
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return "minimal-ui";
  if (window.matchMedia("(display-mode: fullscreen)").matches) return "fullscreen";

  // iOS Safari's legacy signal — no `display-mode: standalone`
  // support before iOS 16 but `navigator.standalone === true` when
  // launched from the home screen.
  const legacyStandalone =
    typeof navigator !== "undefined" &&
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (legacyStandalone) return "standalone";

  return "browser";
}
