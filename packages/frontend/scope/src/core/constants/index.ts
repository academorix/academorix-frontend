/**
 * @file index.ts
 * @module @stackra/scope/core/constants
 * @description Public API barrel for the core `constants` category —
 *   re-exports `DEFAULT_SCOPE_OPTIONS` (defaults merged into every
 *   `ScopeModule.forRoot(...)` call) and the DI tokens (`SCOPE_SERVICE`
 *   / `SCOPE_CONFIG` / `SCOPE_DATA_SOURCE`).
 */

export { DEFAULT_SCOPE_OPTIONS } from "./defaults.constant";
export { SCOPE_SERVICE, SCOPE_CONFIG, SCOPE_DATA_SOURCE } from "./tokens.constant";
