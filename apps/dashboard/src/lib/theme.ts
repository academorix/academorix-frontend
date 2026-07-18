/**
 * @file theme.ts
 * @module lib/theme
 *
 * @description
 * The theme controller: mode (Light / Dark / System). Writes the resolved
 * mode to `<html>` as `data-theme="light"` or `data-theme="dark"` so HeroUI's
 * CSS variables take effect, persists the user's choice to localStorage, and
 * syncs with the OS preference when the mode is `"system"`.
 *
 * Runtime-free: the DI service lives in {@link "@/services/theme"} and the
 * React binding in {@link "@/hooks/use-theme"}.
 */

/** The three mode options the user can select. */
export const THEME_MODES = ["light", "dark", "system"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

/** The resolved appearance — what actually applies after `system` is dereferenced. */
export type ResolvedThemeMode = Exclude<ThemeMode, "system">;

/** The `data-theme` value that lands on `<html>`. */
export type ThemeToken = ResolvedThemeMode;

/** Human labels for the theme selector menu. */
export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

/** localStorage key. */
export const THEME_MODE_STORAGE_KEY = "academorix.theme.mode";

/** Fallback when nothing is persisted and the OS query is unavailable. */
export const DEFAULT_THEME_MODE: ThemeMode = "system";
