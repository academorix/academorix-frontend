/**
 * @file index.ts
 * @module @stackra/logger/core/utils
 * @description Barrel export for logger utilities.
 *
 *   `mergeConfig` was removed in the `@stackra/config` migration —
 *   the `registerAs('logger', () => ({...}))` factory now produces
 *   the final config directly. Env-var overrides (`LOG_LEVEL`,
 *   `APP_DEBUG`) live inside `LoggerManager.normalize()` and the
 *   raw helpers in `env-overrides.util.ts` are package-internal.
 */

/** @deprecated Use `registerAs` from `@stackra/config`. Removed in v0.2. */
export { defineConfig } from "./define-config.util";

// NOTE: `env-overrides.util.ts` is intentionally NOT re-exported.
// It's an internal helper consumed only by `LoggerManager.normalize`.
