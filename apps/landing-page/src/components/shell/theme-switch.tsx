/**
 * @file theme-switch.tsx
 * @module components/shell/theme-switch
 *
 * @description
 * Compact light/dark toggle wired to `next-themes`. `GlassThemeSync`
 * (mounted in `Providers`) mirrors the resolved theme onto
 * `html[data-theme="glass-{light|dark}"]`, so flipping this toggle
 * flips both the OSS `class="dark"` variant AND the HeroUI Pro
 * Glass theme in one action.
 */

"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/** Compact light/dark toggle. */
export function ThemeSwitch({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`inline-flex size-9 items-center justify-center rounded-full border border-default/60 bg-surface/60 text-foreground backdrop-blur-sm transition-colors hover:bg-default/40 ${className ?? ""}`}
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span aria-hidden>{mounted ? (isDark ? "☾" : "☀") : ""}</span>
    </button>
  );
}
