/**
 * @file index.ts
 * @module @academorix/core
 *
 * @description
 * Zero-dependency foundation for the Academorix workspace. Every other
 * `@academorix/*` package builds on top of this one.
 *
 * ## Public API
 *
 *  - {@link "@academorix/core/env"} — `env<T>()` reader + `createEnvReader()` factory.
 *  - {@link "@academorix/core/config"} — `defineConfig<T>()` passthroughs.
 *  - {@link "@academorix/core/errors"} — `HttpError`, `isHttpError`.
 *  - {@link "@academorix/core/brand"} — `Brand<T, Name>`, `LocaleBrand`.
 *  - {@link "@academorix/core/utils"} — `assertNever`, URL joins, etc.
 *
 * ## Import strategy
 *
 * Every subpath is re-exported here for convenience, but consumers
 * SHOULD prefer subpath imports so tree-shaking is optimal:
 *
 * ```ts
 * // Preferred
 * import { env } from "@academorix/core/env";
 * import { defineConfig } from "@academorix/core/config";
 *
 * // OK but pulls the whole barrel
 * import { env, defineConfig } from "@academorix/core";
 * ```
 */

export { createEnvReader, env } from "./env";
export { defineConfig, defineFrozenConfig, defineNamedConfig } from "./config";
export { HttpError, isHttpError } from "./errors";
export { assertDefined, assertNever } from "./utils/assert.util";
export { ensureLeadingSlash, joinUrl, trimTrailingSlash } from "./utils/url.util";

export type { Brand, Unbrand } from "./brand";
export type { LocaleBrand } from "./brand";
