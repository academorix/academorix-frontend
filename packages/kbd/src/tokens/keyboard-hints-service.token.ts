/**
 * @file keyboard-hints-service.token.ts
 * @module @stackra/kbd/tokens
 * @description DI token for the `KeyboardHintsService` — contextual
 *   on-screen bubbles that surface available shortcuts to the user.
 *
 *   Package-owned.
 */

export const KEYBOARD_HINTS_SERVICE: unique symbol = Symbol.for("KEYBOARD_HINTS_SERVICE");
