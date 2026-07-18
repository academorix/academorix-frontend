/**
 * @file index.ts
 * @module @stackra/config/core/utils
 * @description Public API barrel for the `utils` category.
 *
 *   The utils grouping mixes user-facing helpers (`registerAs`,
 *   `getConfigToken`, `env`, `defineConfig`) with package-internal
 *   helpers (`mergeConfigObject`, `getRegistrationToken`,
 *   `createConfigProvider`, `getDefaultParser`, `loadEnvFile`,
 *   `isNode`, nested-value helpers). Every symbol is re-exported here
 *   for internal use; the package's root `index.ts` selectively
 *   re-exports only the user-facing ones.
 */

// ── User-facing ─────────────────────────────────────────────────────
export { registerAs } from "./register-as.util";
export { getConfigToken } from "./get-config-token.util";
export { env } from "./env.util";
export { defineConfig } from "./define-config.util";

// ── Package-internal (needed by config.module / config.service) ─────
export { createConfigProvider } from "./create-config-provider.util";
export { getRegistrationToken } from "./get-registration-token.util";
export { mergeConfigObject } from "./merge-config-object.util";
export { getDefaultParser } from "./default-parser.util";
export { loadEnvFile } from "./load-env-file.util";
export { isNode } from "./is-node.util";
export { getNestedValue } from "./get-nested-value.util";
export { setNestedValue } from "./set-nested-value.util";
export { hasNestedValue } from "./has-nested-value.util";
