/**
 * @file themes.constant.ts
 * @module @stackra/theming/constants
 * @description Built-in theme palette shipped with @stackra/theming.
 *   Mirrors the HeroUI v3 docs theme set. Per-theme CSS variable overrides
 *   live in styles/theme-presets.css under [data-design-theme="<id>"] selectors.
 *
 *   Each theme is a runtime handle: only id / label / color / previewImage
 *   are populated. The design-token map (colours, radii, shadows) is compiled
 *   into `dist/theme-presets.css` at build time — the browser reads them via
 *   `[data-design-theme="<id>"]` selectors, so `tokens` stays undefined here.
 */

import type { ITheme } from "@stackra/contracts";

// ============================================================================
// Individual Theme Definitions
// ============================================================================

/** The default Stackra theme — carries the base design tokens. */
export const THEME_DEFAULT: ITheme = {
  id: "default",
  label: "Default",
  labelKey: "theming.themes.default",
  isSystem: true,
};

/** Sky-blue accent palette. */
export const THEME_SKY: ITheme = {
  id: "sky",
  label: "Sky",
  labelKey: "theming.themes.sky",
  color: "#0ea5e9",
  isSystem: true,
};

/** Soft-lavender accent palette. */
export const THEME_LAVENDER: ITheme = {
  id: "lavender",
  label: "Lavender",
  labelKey: "theming.themes.lavender",
  color: "#a78bfa",
  isSystem: true,
};

/** Fresh mint-green accent palette. */
export const THEME_MINT: ITheme = {
  id: "mint",
  label: "Mint",
  labelKey: "theming.themes.mint",
  color: "#10b981",
  isSystem: true,
};

/** Netflix-inspired red-on-black palette. */
export const THEME_NETFLIX: ITheme = {
  id: "netflix",
  label: "Netflix",
  labelKey: "theming.themes.netflix",
  color: "#e50914",
  isDark: true,
  isSystem: true,
};

/** Uber-inspired monochrome palette. */
export const THEME_UBER: ITheme = {
  id: "uber",
  label: "Uber",
  labelKey: "theming.themes.uber",
  color: "#000000",
  isSystem: true,
};

/** Spotify-inspired green palette. */
export const THEME_SPOTIFY: ITheme = {
  id: "spotify",
  label: "Spotify",
  labelKey: "theming.themes.spotify",
  color: "#1db954",
  isDark: true,
  isSystem: true,
};

/** Coinbase-inspired deep-blue palette. */
export const THEME_COINBASE: ITheme = {
  id: "coinbase",
  label: "Coinbase",
  labelKey: "theming.themes.coinbase",
  color: "#0052ff",
  isSystem: true,
};

/** Airbnb-inspired coral palette. */
export const THEME_AIRBNB: ITheme = {
  id: "airbnb",
  label: "Airbnb",
  labelKey: "theming.themes.airbnb",
  color: "#ff5a5f",
  isSystem: true,
};

/** Discord-inspired blurple palette. */
export const THEME_DISCORD: ITheme = {
  id: "discord",
  label: "Discord",
  labelKey: "theming.themes.discord",
  color: "#5865f2",
  isDark: true,
  isSystem: true,
};

/** Rabbit R1-inspired orange-on-black palette. */
export const THEME_RABBIT: ITheme = {
  id: "rabbit",
  label: "Rabbit",
  labelKey: "theming.themes.rabbit",
  color: "#ff6600",
  isDark: true,
  isSystem: true,
};

// ============================================================================
// Aggregated List
// ============================================================================

/**
 * All built-in themes in display order.
 * Used by `ThemingModule.forRoot()` to seed the `ThemeRegistry`.
 */
export const BUILT_IN_THEMES: readonly ITheme[] = [
  THEME_DEFAULT,
  THEME_SKY,
  THEME_LAVENDER,
  THEME_MINT,
  THEME_NETFLIX,
  THEME_UBER,
  THEME_SPOTIFY,
  THEME_COINBASE,
  THEME_AIRBNB,
  THEME_DISCORD,
  THEME_RABBIT,
];
