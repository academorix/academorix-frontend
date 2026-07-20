/**
 * @file index.ts
 * @module @stackra/events/core/utils
 * @description Barrel export for event utilities.
 *
 *   `mergeConfig` was removed in the `@stackra/config` migration —
 *   the `registerAs('events', () => ({...}))` factory now produces
 *   the final config directly.
 */
/** @deprecated Use `registerAs` from `@stackra/config`. Removed in v0.2. */
export { defineConfig } from "./define-config.util";
