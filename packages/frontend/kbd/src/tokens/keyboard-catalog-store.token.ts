/**
 * @file keyboard-catalog-store.token.ts
 * @module @stackra/kbd/tokens
 * @description DI token for the catalog's reactive state store —
 *   registered via `StateModule.forFeature([{ token: KEYBOARD_CATALOG_STORE, ... }])`.
 *
 *   Package-owned.
 */

export const KEYBOARD_CATALOG_STORE: unique symbol = Symbol.for("KEYBOARD_CATALOG_STORE");
