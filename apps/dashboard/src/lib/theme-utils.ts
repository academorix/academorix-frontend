/**
 * @file theme-utils.ts
 * @module lib/theme-utils
 *
 * @description
 * Pure helpers for reading / writing / applying the theme. Split from
 * `theme.ts` so the type constants stay tiny and tree-shakeable.
 */

import type { ResolvedThemeMode, ThemeMode, ThemeToken } from "@/lib/theme";

import { DEFAULT_THEME_MODE, THEME_MODE_STORAGE_KEY, THEME_MODES } from "@/lib/theme";

/** Type guard. */
export function isThemeMode(value: string): value is ThemeMode {
  return (THEME_MODES as readonly string[]).includes(value);
}

/** Read the persisted mode — falls back to {@link DEFAULT_THEME_MODE}. */
export function readStoredMode(): ThemeMode {
  try {
    const raw = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);

    if (raw && isThemeMode(raw)) return raw;
  } catch {
    // ignore private-mode / disabled storage
  }

  return DEFAULT_THEME_MODE;
}

/** Persist the theme mode. */
export function writeStoredMode(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

/** The OS preference — used when the user's mode choice is `"system"`. */
export function detectSystemAppearance(): ResolvedThemeMode {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Resolve a possibly-`system` mode down to `light` / `dark`. */
export function resolveMode(mode: ThemeMode): ResolvedThemeMode {
  return mode === "system" ? detectSystemAppearance() : mode;
}

/** Resolve the mode into the `data-theme` token that lands on `<html>`. */
export function toThemeToken(mode: ThemeMode): ThemeToken {
  return resolveMode(mode);
}

/**
 * Paint the resolved theme onto `<html>`. Idempotent — safe to call in an
 * effect and also from a `matchMedia` change listener without churning React.
 */
export function applyTheme(token: ThemeToken): void {
  const root = document.documentElement;

  root.setAttribute("data-theme", token);
  // HeroUI also reads a class on the root — keep both attrs in sync.
  root.classList.remove("light", "dark");
  root.classList.add(token);
  root.style.colorScheme = token;
}
