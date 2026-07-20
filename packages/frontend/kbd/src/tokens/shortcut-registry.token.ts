/**
 * @file shortcut-registry.token.ts
 * @module @stackra/kbd/tokens
 * @description DI token for the `ShortcutRegistry` — the authoritative
 *   catalogue of every registered keyboard shortcut.
 *
 *   Package-owned. Consumers inject the token to register / list /
 *   look up shortcuts without depending on the concrete class name.
 */

export const SHORTCUT_REGISTRY: unique symbol = Symbol.for("SHORTCUT_REGISTRY");
