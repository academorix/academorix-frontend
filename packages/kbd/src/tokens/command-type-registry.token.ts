/**
 * @file command-type-registry.token.ts
 * @module @stackra/kbd/tokens
 * @description DI token for the `CommandTypeRegistry` — the taxonomy of
 *   command / shortcut categories (`navigation`, `tool`, `action`, ...).
 *
 *   Package-owned.
 */

export const COMMAND_TYPE_REGISTRY: unique symbol = Symbol.for("COMMAND_TYPE_REGISTRY");
