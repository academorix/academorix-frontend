/**
 * @file state-store.tokens.ts
 * @module @stackra/contracts/tokens
 * @description Shared store tokens used across the state / SDUI boundary.
 */

/**
 * Shared symbol identifying the SDUI runtime's local `$.state` store when
 * registered with `StateRegistry`.
 *
 * `@stackra/sdui`'s `<SduiRuntimeProvider>` registers its per-screen state
 * as a normal store under this token at mount, so schema-level `setState`
 * / `toggleState` actions route through `@stackra/state`'s `SetStateHandler`
 * just like any other DI-managed store — no SDUI-specific branch in the
 * handler.
 */
export const SDUI_RUNTIME_STORE = Symbol.for("SDUI_RUNTIME_STORE");
