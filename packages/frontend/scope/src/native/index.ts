/**
 * @file index.ts
 * @module @stackra/scope/native
 * @description React Native bindings for the client scope runtime.
 *
 *   Ships:
 *   - `NativeScopeModule.forRoot(...)` — backward-compatible alias of
 *     `ScopeModule.forRoot(...)`. Defaults `storage` to
 *     `'asyncStorage'` for zero-config parity with prior versions.
 *   - `NativeScopeSwitcher` — HeroUI Native `Select`-based scope
 *     picker (mobile parity for the web `ScopeSwitcher`).
 *   - Cross-platform hooks (`useScope`, `useScopeTree`, `useScopeValue`)
 *     re-exported so a native app can import everything scope-related
 *     from a single subpath.
 *
 *   For direct construction of the storage-backed persist adapter,
 *   import `StorageBackedScopePersistAdapter` from `@stackra/scope`.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { NativeScopeModule, type NativeScopeRootOptions } from "./native-scope.module";

// ════════════════════════════════════════════════════════════════════════════════
// Components (built on @stackra/ui/native)
// ════════════════════════════════════════════════════════════════════════════════
export { NativeScopeSwitcher } from "./components";

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════
export type { NativeScopeSwitcherProps } from "./interfaces";

// ════════════════════════════════════════════════════════════════════════════════
// Cross-platform hook re-exports (single source in ./react/hooks)
// ════════════════════════════════════════════════════════════════════════════════
export { useScope, useScopeTree, useScopeValue } from "@/react/hooks";
export type { UseScopeResult } from "@/react/hooks";
