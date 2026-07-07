/**
 * @file is-desktop.ts
 * @module desktop/is-desktop
 *
 * @description
 * Feature-detects the Tauri v2 runtime. Every adapter under `src/desktop/*`
 * checks this at call time and gracefully no-ops on the web build — code
 * that imports a desktop adapter must always work in the browser too.
 *
 * ## Why not UA-sniff
 *
 * User-agent strings on WebView2 (Windows) and WKWebView (macOS) are close
 * enough to Edge/Safari that string matching would false-positive on regular
 * browser users. The `window.__TAURI_INTERNALS__` marker (Tauri v2) — or
 * `window.__TAURI__` for backwards compatibility with the v1 API surface —
 * is set by the Tauri runtime and only present inside the shell.
 *
 * ## SSR safety
 *
 * The `typeof window` guard keeps this callable during Node-side
 * server-render code paths (there aren't any today in the dashboard, but the
 * shape stays the same for the marketing app + any future SSR).
 *
 * @see DESKTOP_PLAN.md §2.1
 */

/**
 * `true` when the runtime is Tauri v2. Cheap enough to inline everywhere —
 * evaluates once per import and cannot flip mid-session (the same webview
 * either has the runtime attached or it doesn't).
 */
export const isDesktop: boolean =
  typeof window !== "undefined" &&
  (Object.prototype.hasOwnProperty.call(window, "__TAURI_INTERNALS__") ||
    Object.prototype.hasOwnProperty.call(window, "__TAURI__"));

/**
 * The same check as the module-level constant, but callable — sometimes
 * useful in tests where the global is patched after import time. In
 * production code, prefer the constant.
 */
export function isDesktopRuntime(): boolean {
  if (typeof window === "undefined") return false;

  return (
    Object.prototype.hasOwnProperty.call(window, "__TAURI_INTERNALS__") ||
    Object.prototype.hasOwnProperty.call(window, "__TAURI__")
  );
}
