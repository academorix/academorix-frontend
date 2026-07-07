/**
 * @file glass-theme-sync.tsx
 * @module components/theme/glass-theme-sync
 *
 * @description
 * Client-side companion to `next-themes` that keeps the HeroUI Pro
 * Glass theme's `data-theme` attribute in sync with the resolved
 * light/dark preference.
 *
 * ## Why we need it
 *
 * `next-themes` writes `class="dark"` (or `class="light"`) on
 * `<html>` when the user's preference resolves. That's what our
 * Tailwind `dark:` variant and HeroUI OSS's dark-token surface read.
 *
 * HeroUI Pro's Glass theme overrides component styles under two
 * additional selectors:
 *
 *   - `html.glass-light` / `html[data-theme="glass-light"]`
 *   - `html.glass-dark`  / `html[data-theme="glass-dark"]`
 *
 * Importing the theme CSS is not enough on its own; one of those
 * selectors must match. This component subscribes to `resolvedTheme`
 * and stamps `data-theme="glass-{light|dark}"` on `<html>` on every
 * change. Because we set the `data-theme` variant (not the class
 * variant), next-themes' own `class="dark"` continues to flow
 * unchanged — so both Tailwind `dark:` utilities AND the Glass
 * component overrides work together.
 *
 * ## Rendering
 *
 * Renders nothing. Pure side effect on the DOM. Safe to mount
 * anywhere under `<NextThemesProvider>`.
 *
 * ## Boot behaviour
 *
 * The initial paint happens before `useTheme()` resolves, so on the
 * very first render `resolvedTheme` may be `undefined`. In that
 * case we fall back to the OS preference via `matchMedia`. On the
 * server this component doesn't render at all — the "use client"
 * directive keeps it out of RSC output — so there's no SSR/CSR
 * mismatch to worry about.
 */

"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

/** HeroUI Pro Glass theme variant name. */
type GlassMode = "glass-light" | "glass-dark";

/**
 * Resolve `next-themes`' `resolvedTheme` to the matching Glass
 * data-theme value. Falls back to `matchMedia` when next-themes
 * hasn't hydrated yet, and finally to `glass-light` as a
 * deterministic default.
 */
function resolveGlassMode(resolvedTheme: string | undefined): GlassMode {
  if (resolvedTheme === "dark") {
    return "glass-dark";
  }

  if (resolvedTheme === "light") {
    return "glass-light";
  }

  // Pre-hydration or unknown value — read the OS preference.
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    return prefersDark ? "glass-dark" : "glass-light";
  }

  return "glass-light";
}

/**
 * Mirrors `next-themes`' resolved theme into
 * `html[data-theme="glass-{light|dark}"]` so the HeroUI Pro Glass
 * theme's component overrides activate.
 *
 * Mount once, at the root of the client provider tree, inside
 * `<NextThemesProvider>`. Renders nothing.
 */
export function GlassThemeSync(): null {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const mode = resolveGlassMode(resolvedTheme);

    // Set the attribute; do NOT clear next-themes' class="dark".
    // Both selectors need to coexist so Tailwind's `dark:` variant
    // (class-based) and HeroUI Pro Glass overrides
    // (data-attribute-based) both stay accurate.
    document.documentElement.setAttribute("data-theme", mode);

    return () => {
      // On unmount we intentionally leave the attribute in place —
      // pulling it out would flash-unstyle every mounted Glass
      // component before route transition finishes.
    };
  }, [resolvedTheme]);

  return null;
}
