/**
 * @file command-palette-service.token.ts
 * @module @stackra/kbd/tokens
 * @description DI token for the `CommandPaletteService` — the imperative
 *   API for opening / closing / driving the palette overlay.
 *
 *   Package-owned.
 */

export const COMMAND_PALETTE_SERVICE: unique symbol = Symbol.for("COMMAND_PALETTE_SERVICE");
