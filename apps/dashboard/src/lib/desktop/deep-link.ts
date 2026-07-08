/**
 * @file deep-link.ts
 * @module desktop/deep-link
 *
 * @description
 * Subscribes to `academorix://` URLs the OS forwards to the Tauri
 * shell via `tauri-plugin-deep-link`. Route table lives in
 * DESKTOP_PLAN.md §4.5:
 *
 *  - `academorix://workspace/{slug}` → `/{slug}/dashboard`
 *  - `academorix://workspace/{slug}/{resource}` → `/{slug}/{resource}`
 *  - `academorix://reset-password?token=…&email=…` → `/reset-password?…`
 *  - `academorix://invite?code=…` → `/invite/{code}`
 *  - `academorix://join?token=…` → `/onboarding/join?…`
 *
 * This module owns the JS-side wire protocol; the router mapping
 * lives in the caller ({@link DesktopBootstrap} wires the callback
 * to `navigate()` via React Router). Kept separate so the resolver
 * is unit-testable without React Router in the dependency graph.
 *
 * ## Phase gating
 *
 * `tauri-plugin-deep-link` sits behind the `phase3` cargo feature.
 * When the feature is off the plugin isn't registered — the JS
 * subscribe throws and we log a dev-only message. That's the
 * correct degradation.
 */

import { DEEP_LINK_SCHEME } from "@/config/desktop.config";
import { isDesktop } from "@/lib/desktop/is-desktop";

/** Payload delivered by the Rust shell when a deep link arrives. */
export interface DeepLinkPayload {
  /** Full URL as delivered by the OS (e.g. `academorix://workspace/nike`). */
  url: string;
}

/**
 * Result of parsing a deep-link URL into a router path. The caller
 * uses this to drive `navigate(path)` — the resolver stays pure so
 * the router isn't a dependency of this module.
 */
export interface ResolvedDeepLink {
  /** Absolute router path, e.g. `/nike/dashboard`. */
  path: string;
  /** Whether the parse consumed the URL (`false` = fall through to noop). */
  handled: boolean;
}

/**
 * Parses a raw `academorix://…` URL into a router-friendly path.
 * Returns `{ handled: false }` for unknown routes so the caller can
 * ignore the event without crashing.
 *
 * Pure by design — no React Router / navigation side effects. The
 * caller drives navigation.
 */
export function resolveDeepLinkPath(url: string): ResolvedDeepLink {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return { path: "/", handled: false };
  }

  if (parsed.protocol !== `${DEEP_LINK_SCHEME}:`) {
    // Not one of ours — let the OS handle it. This branch also
    // catches accidental `http://` URLs a caller may forward.
    return { path: "/", handled: false };
  }

  // `new URL("academorix://reset-password?token=x")` parses the
  // hostname as `reset-password` and pathname as `/`. Detect the
  // route via the hostname, then the pathname for sub-routes.
  const host = parsed.hostname.toLowerCase();

  switch (host) {
    case "workspace": {
      // academorix://workspace/{slug}[/{resource}]
      const [_, slug, ...rest] = parsed.pathname.split("/").filter(Boolean).length
        ? ["", ...parsed.pathname.split("/").filter(Boolean)]
        : ["", ""];

      if (!slug) return { path: "/", handled: false };
      const suffix = rest.length > 0 ? `/${rest.join("/")}` : "/dashboard";

      return { path: `/${slug}${suffix}${parsed.search}`, handled: true };
    }
    case "reset-password":
      return { path: `/reset-password${parsed.search}`, handled: true };
    case "invite": {
      const code = parsed.searchParams.get("code");

      if (!code) return { path: "/", handled: false };

      return { path: `/invite/${encodeURIComponent(code)}`, handled: true };
    }
    case "join":
      return { path: `/onboarding/join${parsed.search}`, handled: true };
    default:
      return { path: "/", handled: false };
  }
}

/**
 * Subscribe to `academorix://` URLs the OS forwards to the desktop shell.
 * Returns an unsubscribe function. When the plugin isn't available
 * (phase-gated off on the Rust side), the subscribe becomes a no-op
 * and the returned dispose is idempotent.
 *
 * @example
 * ```ts
 * useEffect(() => onDeepLink((payload) => {
 *   const { path, handled } = resolveDeepLinkPath(payload.url);
 *   if (handled) navigate(path);
 * }), []);
 * ```
 */
export function onDeepLink(handler: (payload: DeepLinkPayload) => void): () => void {
  if (!isDesktop) {
    return () => {
      /* web build no-op */
    };
  }

  let disposed = false;
  let cleanup: () => void = () => {
    disposed = true;
  };

  // Optional plugin package; only present when the `phase3` cargo
  // feature is on. Storing the module id in a variable stops Vite's
  // static import analyser from trying to resolve it at bundle time
  // — the dynamic import fails at runtime when the plugin isn't
  // installed, which we handle in the catch below.
  const pluginId = "@tauri-apps/plugin-deep-link";

  void import(/* @vite-ignore */ pluginId)
    .then((mod) => {
      // Tauri v2's deep-link plugin exposes `onOpenUrl` which fires
      // for every URL matching the registered scheme. It resolves
      // with an unsubscribe function.
      return mod.onOpenUrl((urls: readonly string[]) => {
        // The plugin passes an array in v2 (some OSes forward
        // multiple URLs simultaneously; e.g. a "share to" invocation
        // on Android). Forward each one to the handler.
        for (const url of urls) {
          handler({ url });
        }
      });
    })
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
      // Plugin unavailable (phase3 cargo feature off, or OS scheme
      // registration failed). Non-fatal — the SPA still works.
      // eslint-disable-next-line no-console
      console.info("[desktop/deep-link] plugin unavailable; deep links disabled", err);
    });

  return () => cleanup();
}
