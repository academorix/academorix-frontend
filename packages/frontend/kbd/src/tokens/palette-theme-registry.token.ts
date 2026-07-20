/**
 * @file palette-theme-registry.token.ts
 * @module @stackra/kbd/tokens
 * @description DI token for the `PaletteThemeRegistry` — the collection of
 *   named palette themes (`default`, `raycast`, `shopify`, `spotlight`, ...).
 *
 *   Package-owned.
 */

export const PALETTE_THEME_REGISTRY: unique symbol = Symbol.for("PALETTE_THEME_REGISTRY");
