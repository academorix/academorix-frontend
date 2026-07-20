/**
 * @file keyboard-hints-store.token.ts
 * @module @stackra/kbd/tokens
 * @description DI token for the hints overlay's reactive state store —
 *   registered via `StateModule.forFeature([{ token: KEYBOARD_HINTS_STORE, ... }])`.
 *
 *   Package-owned.
 */

export const KEYBOARD_HINTS_STORE: unique symbol = Symbol.for("KEYBOARD_HINTS_STORE");
