/**
 * @file detect-surface.ts
 * @module onboarding/detect-surface
 *
 * @description
 * Pure surface-detection logic. Given a browser environment (the
 * `window` and the URL) return one of five surfaces:
 *
 * - `desktop` — running inside the Tauri shell.
 * - `pwa-shortcut` — user launched via a Web App Manifest shortcut. The
 *   manifest appends `?source=pwa-shortcut` on the shortcut's `url`.
 * - `pwa` — user launched the installed PWA. Three redundant signals:
 *   `?source=pwa` on the URL (from `start_url`),
 *   `matchMedia('(display-mode: standalone)')` (works in every modern
 *   browser), or the Android-specific `document.referrer` starting with
 *   `android-app://`.
 * - `deep-link` — user arrived from a `academorix://` URL. This normally
 *   resolves at the OS level to a specific route, but external callers
 *   sometimes pass the raw URL through as a query parameter (`?deep=…`);
 *   this branch catches that case.
 * - `web` — everything else (default).
 *
 * Detection is expressed as a pure function `detectSurface(input)` for
 * two reasons:
 *
 * 1. Unit-testable — every branch has a fixture we can hand-craft.
 * 2. Cacheable — {@link "@/lib/onboarding/use-surface" useSurface} calls this
 *    exactly once per session and stores the result in module scope.
 *
 * The reactive React wrapper lives at `use-surface.ts`; this file is
 * pure so a background code path (e.g. an analytics dispatcher) can also
 * consume it without pulling React into its dependency graph.
 *
 * @see onboarding module — Surface detection matrix.
 */

import type { OnboardingSurface } from "@/config/onboarding.config";

/**
 * The set of inputs {@link detectSurface} needs. Every field is optional
 * so callers can supply a partial fixture in tests; production callers
 * pass the real `window` + URL.
 */
export interface DetectSurfaceInput {
  /**
   * The `window` object. Detected surfaces:
   *  - `desktop`: `"__TAURI__" in window`.
   *  - `pwa` (fallback signal): `matchMedia('(display-mode: standalone)')`.
   *
   * Absent (SSR / Node) → always resolves to `"web"`.
   */
  window?: Window;
  /**
   * The parsed URL. We check `searchParams` for `?source=…` (from the
   * PWA manifest's `start_url` and shortcuts) and `?deep=academorix://…`
   * for deep-link fallbacks.
   */
  url?: URL;
  /**
   * `document.referrer` — Android-specific PWA signal. When a PWA is
   * launched from the Android home screen, Chrome sets this to
   * `android-app://…`.
   */
  referrer?: string;
}

/**
 * Reserved URL scheme for Academorix deep links. Registered on the
 * desktop shell via `tauri-plugin-deep-link` and on iOS/Android via
 * Universal Links / App Links (Phase 3+).
 *
 * NOTE: MUST match {@link "@/config/desktop.config".DEEP_LINK_SCHEME}.
 * Duplicated here (rather than imported) so this file has zero runtime
 * imports and stays trivially unit-testable.
 */
const DEEP_LINK_SCHEME = "academorix";

/**
 * Detects the surface from a bag of environmental inputs.
 *
 * Ordering matters: `desktop` wins over `pwa-shortcut` (a Tauri window
 * could technically be launched with any URL, but the shell context
 * takes precedence). `pwa-shortcut` wins over `pwa` (the shortcut is a
 * more specific signal than the display-mode media query). `deep-link`
 * is the last non-default check.
 *
 * @param input - Environment snapshot. All fields optional for tests.
 * @returns The detected surface. Never throws.
 *
 * @example
 * ```ts
 * // Tauri desktop shell:
 * detectSurface({ window: makeTauriWindow() }) // → "desktop"
 *
 * // PWA installed on Android home screen:
 * detectSurface({
 *   url: new URL("https://app.academorix.com/dashboard?source=pwa"),
 *   window: makeStandaloneWindow(),
 * }) // → "pwa"
 *
 * // Manifest shortcut:
 * detectSurface({
 *   url: new URL("https://app.academorix.com/athletes/create?source=pwa-shortcut"),
 * }) // → "pwa-shortcut"
 * ```
 */
export function detectSurface(input: DetectSurfaceInput = {}): OnboardingSurface {
  const { window: win, url, referrer } = input;

  // 1. Desktop — highest priority. If we're inside Tauri, that's the
  //    truth even if the URL happens to carry a `?source=pwa` marker.
  if (win !== undefined && "__TAURI__" in win) {
    return "desktop";
  }

  // 2. PWA manifest shortcut — more specific than a plain PWA launch.
  const source = url?.searchParams.get("source");

  if (source === "pwa-shortcut") {
    return "pwa-shortcut";
  }

  // 3. PWA — three redundant signals (any one is enough):
  //    a. `?source=pwa` on the URL — from the manifest's `start_url`.
  //    b. `matchMedia('(display-mode: standalone)')` — universal signal
  //       that the app is running in the "installed" chromeless mode.
  //    c. `document.referrer` prefixed with `android-app://` — the
  //       Android-specific signal Chrome sets when the PWA launched
  //       from the home screen.
  if (source === "pwa") {
    return "pwa";
  }

  if (win !== undefined && matchesStandaloneDisplayMode(win)) {
    return "pwa";
  }

  if (typeof referrer === "string" && referrer.startsWith("android-app://")) {
    return "pwa";
  }

  // 4. Deep link — passed through as `?deep=academorix://…`. Rare but
  //    used by the desktop shell when forwarding an external URL open.
  const deep = url?.searchParams.get("deep");

  if (typeof deep === "string" && deep.startsWith(`${DEEP_LINK_SCHEME}://`)) {
    return "deep-link";
  }

  // 5. Default — plain browser tab.
  return "web";
}

/**
 * Safe wrapper around `matchMedia('(display-mode: standalone)')`. The
 * jsdom test environment doesn't return truthy `matches` for it (which
 * is the correct default), but some browsers throw on the query string
 * if the API is disabled — we catch and return `false`.
 */
function matchesStandaloneDisplayMode(win: Window): boolean {
  try {
    // Chromium / Edge / Firefox / Safari all support this.
    if (typeof win.matchMedia !== "function") {
      return false;
    }

    return win.matchMedia("(display-mode: standalone)").matches;
  } catch {
    return false;
  }
}

/**
 * Snapshot the current browser environment. Convenience wrapper called
 * by {@link "@/lib/onboarding/use-surface" useSurface} on first render.
 *
 * Returns an empty input in SSR / Node.
 */
export function readSurfaceInput(): DetectSurfaceInput {
  if (typeof window === "undefined") {
    return {};
  }

  return {
    window,
    url: new URL(window.location.href),
    referrer: typeof document !== "undefined" ? document.referrer : undefined,
  };
}
