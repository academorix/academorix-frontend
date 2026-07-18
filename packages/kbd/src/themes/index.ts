/**
 * Built-in palette themes.
 *
 * Apps can add their own through `KbdModule.forFeature({ themes })`.
 *
 * @module @stackra/kbd
 * @category Themes
 */

import { defaultTheme } from "./default.theme";
import { raycastTheme } from "./raycast.theme";
import { shopifyTheme } from "./shopify.theme";
import { spotlightTheme } from "./spotlight.theme";

import type { PaletteTheme } from "../interfaces/palette-theme.interface";

export { defaultTheme } from "./default.theme";
export { raycastTheme } from "./raycast.theme";
export { shopifyTheme } from "./shopify.theme";
export { spotlightTheme } from "./spotlight.theme";

/**
 * Built-in themes registered automatically by the
 * {@link PaletteThemeRegistry} on init.
 */
export const BUILTIN_PALETTE_THEMES: readonly PaletteTheme[] = Object.freeze([
  defaultTheme,
  raycastTheme,
  spotlightTheme,
  shopifyTheme,
]);
