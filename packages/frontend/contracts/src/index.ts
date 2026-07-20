/**
 * @file index.ts
 * @module @stackra/contracts
 * @description Public API for @stackra/contracts.
 *
 *   Zero-runtime vocabulary shared across every @stackra/* package.
 *
 *   Layout:
 *   - `tokens/`     — Symbol.for(...) DI tokens
 *   - `interfaces/` — every `interface`
 *   - `types/`      — every standalone `type` alias
 *   - `enums/`      — every `enum` and its priority maps
 *   - `events/`     — event constant maps + event name unions
 */

// ============================================================================
// Tokens
// ============================================================================
export * from "./tokens";

// ============================================================================
// Events
// ============================================================================
export * from "./events";

// ============================================================================
// Interfaces (DI foundation + domain contracts)
// ============================================================================
export * from "./interfaces";

// ============================================================================
// Types
// ============================================================================
export * from "./types";

// ============================================================================
// Enums
// ============================================================================
export * from "./enums";

// ============================================================================
// Legacy aliases (kept for backwards compatibility with older consumers)
// ============================================================================
export type { Provider as IProvider } from "./types/provider.type";
export { Scope as IScope } from "./enums/scope.enum";
