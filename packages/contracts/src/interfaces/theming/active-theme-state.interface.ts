/**
 * @file active-theme-state.interface.ts
 * @module @stackra/contracts/interfaces/theming
 * @description The reactive shape held by `ACTIVE_THEME_STORE`.
 *
 *   This is the single source of truth for "what theme + mode is the
 *   user currently seeing." Client-side platform bindings subscribe
 *   to the store and mirror the shape into DOM attributes; the
 *   `ThemeService` writes to it in response to user actions; the
 *   persistence broadcaster hydrates it from `localStorage` on boot.
 */

import type { ColorMode } from "./color-mode.type";
import type { ResolvedMode } from "./resolved-mode.type";

/**
 * The reactive theme state — one row in a TanStack Store wired via
 * `StateModule.forFeature({ token: ACTIVE_THEME_STORE, ... })`.
 */
export interface IActiveThemeState {
  /**
   * Currently-active theme id. Matches an `ITheme.id` known to the
   * default source. `'default'` at boot until persistence / the API
   * source hydrate a saved preference.
   */
  readonly id: string;

  /**
   * User-selected color mode. `'system'` follows OS preference,
   * `'light'` / `'dark'` force the resolved mode.
   */
  readonly mode: ColorMode;

  /**
   * Resolved mode — always one of `'light'` / `'dark'` (never
   * `'system'`). When `mode === 'system'`, this mirrors the OS
   * preference reported by `IThemeBindings.getSystemColorScheme()`.
   * When `mode` is explicit, this equals `mode`.
   */
  readonly resolvedMode: ResolvedMode;
}
