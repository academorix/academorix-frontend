/**
 * @file state.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the reactive state subsystem.
 *
 *   `STATE_REGISTRY` lives in contracts (not `@stackra/state`) so
 *   cross-package consumers — devtools panels, error reporters, the SDUI
 *   runtime — can inject the store registry for introspection without
 *   pulling in the `@stackra/state` runtime. Mirrors CACHE_MANAGER,
 *   EVENT_EMITTER, NETWORK_SERVICE.
 */

/** Token for the `StateRegistry` — the index of all DI-managed reactive stores. */
export const STATE_REGISTRY = Symbol.for("STATE_REGISTRY");
