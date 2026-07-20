/**
 * @file theme.service.ts
 * @module @stackra/console/services
 * @description Console theming system for customizable CLI visual output.
 *   Provides a configurable colour palette + icon set + styling primitives
 *   that consumers override for branded CLI experiences.
 *
 *   The active theme is a module-scoped singleton. `setTheme(...)` deep-
 *   merges a partial theme over the defaults so consumers can override just
 *   the palette (say, to their brand cyan) without redeclaring every icon.
 */

import { DEFAULT_ICONS, DEFAULT_PALETTE, DEFAULT_THEME } from "./theme.constants";

import type { IConsoleTheme } from "../interfaces/console-theme.interface";

// Re-export the theme constants so consumers (and tests) can import the
// mutation API (`getTheme`/`setTheme`/`resetTheme`) AND the shipped
// preset shapes from a single module — otherwise callers reach into
// `theme.constants` for the shapes and `theme.service` for the mutators,
// which is one import too many for a one-file concern.
export {
  DEFAULT_ICONS,
  DEFAULT_PALETTE,
  DEFAULT_THEME,
  MINIMAL_THEME,
  VIBRANT_THEME,
} from "./theme.constants";

// ── Active theme (module-scoped singleton) ─────────────────────────────
// Kept mutable so `setTheme(...)` can swap it at boot time.
let activeTheme: IConsoleTheme = { ...DEFAULT_THEME };

/**
 * Get the currently active console theme.
 *
 * @returns The active theme configuration.
 */
export function getTheme(): IConsoleTheme {
  return activeTheme;
}

/**
 * Set the active console theme. Deep-merges the partial theme with
 * `DEFAULT_THEME` so consumers only supply the entries they want to
 * override — omitted palette keys stay at their default `ColorFn`s;
 * omitted icons stay at their default glyphs.
 *
 * @param theme - Full or partial theme to merge on top of the defaults.
 */
export function setTheme(theme: Partial<IConsoleTheme>): void {
  activeTheme = {
    ...DEFAULT_THEME,
    ...theme,
    palette: { ...DEFAULT_PALETTE, ...theme.palette },
    icons: { ...DEFAULT_ICONS, ...theme.icons },
  };
}

/**
 * Reset the theme to `DEFAULT_THEME`. Useful in tests that call
 * `setTheme(...)` inside a `beforeEach` to guarantee isolation.
 */
export function resetTheme(): void {
  activeTheme = { ...DEFAULT_THEME };
}
