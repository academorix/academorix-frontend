/**
 * @file index.ts
 * @module @stackra/i18n/core/utils
 * @description Barrel export for i18n utility functions.
 */

export { defineConfig } from "./define-config.util";
export { mergeConfig } from "./merge-config.util";
export { interpolate } from "./interpolate.util";
export { getPluralObject, selectPlural } from "./pluralize.util";
export { resolveLanguage, getNextFallbackLanguage } from "./resolve-language.util";
export { mergeDeep } from "./merge-deep.util";
export { isRtlLocale, getDirection } from "./rtl.util";
export { __, setDefaultTranslator } from "./translate.util";

// Note: `generateI18nTypes` is intentionally NOT re-exported here. It
// reads translation files from disk via `node:fs` at module scope, so
// re-exporting it from the runtime barrel would drag `fs` / `path` into
// every client bundle that imports from `@stackra/i18n`. It lives at
// `@stackra/i18n/vite` (a build-time subpath) — that is the only path
// consumers should use to codegen types.
