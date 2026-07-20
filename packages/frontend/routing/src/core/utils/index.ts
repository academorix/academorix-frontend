/**
 * @file index.ts
 * @module @stackra/routing/core/utils
 * @description Public API barrel for the `utils/` category.
 */

/** @deprecated Import `registerAs` from `@stackra/config`. Removed in v0.2. */
export { defineConfig } from "./define-config.util";
/** @deprecated Import `registerAs` from `@stackra/config`. Removed in v0.2. */
export { defineRoutingConfig } from "./define-routing-config.util";
export { defineRoute } from "./define-route.util";
export { defineLayout } from "./define-layout.util";
export { definePage } from "./define-page.util";
export { defineRouterConfig } from "./define-router-config.util";
export { mergeConfig } from "./merge-config.util";
export { resolveValue } from "./resolve-value.util";
export { slugify } from "./slugify.util";
