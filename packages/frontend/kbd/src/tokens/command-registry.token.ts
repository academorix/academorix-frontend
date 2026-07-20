/**
 * @file command-registry.token.ts
 * @module @stackra/kbd/tokens
 * @description DI token for the `CommandRegistry` — the palette / spotlight
 *   command catalogue.
 *
 *   Package-owned. Consumers inject the token to register commands and
 *   sources that populate the command palette.
 */

export const COMMAND_REGISTRY: unique symbol = Symbol.for("COMMAND_REGISTRY");
