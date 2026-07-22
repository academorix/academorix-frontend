/**
 * @file index.ts
 * @module @stackra/scope/core/constants
 * @description Public API barrel for the core `constants` category —
 *   re-exports `DEFAULT_SCOPE_OPTIONS` (defaults merged into every
 *   `ScopeModule.forRoot(...)` call) plus the DI tokens.
 *
 *   `SCOPE_SERVICE` is re-exported from `@stackra/contracts` for
 *   backwards compatibility with the pre-`contract-reexports.md`
 *   public surface — new consumers should import it directly from
 *   contracts. See the retrofit note in
 *   `.kiro/steering/contract-reexports.md`.
 */

export { DEFAULT_SCOPE_OPTIONS } from "./defaults.constant";
export { SCOPE_CONFIG, SCOPE_DATA_SOURCE } from "./tokens.constant";
export { SCOPE_SERVICE } from "@stackra/contracts";
