/**
 * @file command-palette-store.token.ts
 * @module @stackra/kbd/tokens
 * @description DI token for the palette's reactive state store —
 *   registered via `StateModule.forFeature([{ token: COMMAND_PALETTE_STORE, ... }])`.
 *
 *   Package-owned.
 */

export const COMMAND_PALETTE_STORE: unique symbol = Symbol.for("COMMAND_PALETTE_STORE");
