/**
 * @file index.ts
 * @module @stackra/csp/react
 * @description React (web) bindings for the CSP runtime — the nonce
 *   context + provider, the `useNonce()` hook, the CSP-safe `<Script>`
 *   injector, and the `<CspMeta>` head renderer. Re-exports the core API
 *   for convenience.
 */

// Contexts
export { NonceContext } from "./contexts";

// Providers
export { NonceProvider } from "./providers";

// Components
export { Script, CspMeta } from "./components";

// Hooks
export { useNonce } from "./hooks";

// Utils
export { readDocumentNonce } from "./utils";

// Interfaces
export type { NonceProviderProps, ScriptProps } from "./interfaces";

// Core re-export
export * from "../core";
