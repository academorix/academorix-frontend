/**
 * @file index.ts
 * @module @stackra/cache/core/utils
 * @description Barrel export for cache utilities.
 *
 *   `mergeConfig` was removed in the `@stackra/config` factory
 *   adoption — the `registerAs(...)` factory now produces the final
 *   config directly (defaults inline via `env('X', default)`), so
 *   the package no longer needs a merge pass.
 */

/** @deprecated Use `registerAs` from `@stackra/config`. Removed in v0.2. */
export { defineConfig } from "./define-config.util";
export { requireStoreMethod } from "./require-store-method.util";
