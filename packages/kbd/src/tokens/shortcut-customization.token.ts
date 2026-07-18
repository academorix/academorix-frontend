/**
 * @file shortcut-customization.token.ts
 * @module @stackra/kbd/tokens
 * @description DI token for the `ShortcutCustomizationService` — the
 *   user-facing "rebind this shortcut" surface with persistence.
 *
 *   Package-owned.
 */

export const SHORTCUT_CUSTOMIZATION: unique symbol = Symbol.for("SHORTCUT_CUSTOMIZATION");
