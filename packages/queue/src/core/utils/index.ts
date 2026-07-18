/**
 * @file index.ts
 * @module @stackra/queue/core/utils
 * @description Barrel export for queue utility functions.
 *
 *   `mergeConfig` was removed in the `@stackra/config` migration —
 *   the `registerAs('queue', () => ({...}))` factory now produces
 *   the final config directly.
 */
/** @deprecated Use `registerAs` from `@stackra/config`. Removed in v0.2. */
export { defineConfig } from "./define-config.util";
export { getQueueToken, getQueueConnectionToken } from "./token-builders.util";
export { generateJobId, computeBackoff, computeUniqueId } from "./job-helpers.util";
