/**
 * @file command-palette-service.token.ts
 * @module @academorix/dashboard/tokens
 * @description Injection token for {@link CommandPaletteService} — resolve
 *   via `useInject(COMMAND_PALETTE_SERVICE)` (React) or
 *   `@Inject(COMMAND_PALETTE_SERVICE)` (class).
 */

/** DI token bound to `CommandPaletteService`. */
export const COMMAND_PALETTE_SERVICE: unique symbol = Symbol("COMMAND_PALETTE_SERVICE");
