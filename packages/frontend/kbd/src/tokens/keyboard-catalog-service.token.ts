/**
 * @file keyboard-catalog-service.token.ts
 * @module @stackra/kbd/tokens
 * @description DI token for the `KeyboardCatalogService` — the "show all
 *   shortcuts" overlay (⇧?).
 *
 *   Package-owned.
 */

export const KEYBOARD_CATALOG_SERVICE: unique symbol = Symbol.for("KEYBOARD_CATALOG_SERVICE");
