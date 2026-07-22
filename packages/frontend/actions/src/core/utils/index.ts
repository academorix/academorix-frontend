/**
 * @file index.ts
 * @module @stackra/actions/core/utils
 * @description Public API barrel for the `utils` category — re-exports the
 *   typed `defineConfig` authoring helper and the `mergeConfig` normalizer
 *   that applies module defaults to consumer-supplied options.
 */

export { defineConfig } from "./define-config.util";
export { mergeConfig } from "./merge-config.util";
