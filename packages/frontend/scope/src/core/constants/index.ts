/**
 * @file index.ts
 * @module @stackra/scope/core/constants
 * @description Public API barrel for the core `constants` category —
 *   re-exports `DEFAULT_SCOPE_OPTIONS` (defaults merged into every
 *   `ScopeModule.forRoot(...)` call) plus the package-owned DI tokens
 *   (`SCOPE_CONFIG`, `SCOPE_DATA_SOURCE`).
 *
 *   `SCOPE_SERVICE` lives canonically in `@stackra/contracts`; import
 *   it directly from there.
 */

export { DEFAULT_SCOPE_OPTIONS } from "./defaults.constant";
export { SCOPE_CONFIG, SCOPE_DATA_SOURCE } from "./tokens.constant";
