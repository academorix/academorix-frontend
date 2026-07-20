/**
 * @file index.ts
 * @module @stackra/routing/seo/utils
 * @description Public API barrel for SEO pipeline helpers.
 *
 *   Just the two pipeline helpers — `mergeDescriptors` merges a
 *   descriptor chain, `buildSeoTags` turns a resolved descriptor
 *   into the flat framework-neutral tag list. JSON-LD builders live
 *   in the sibling `../json-ld/` folder.
 */

export { mergeDescriptors } from "./merge-descriptors.util";
export { buildSeoTags } from "./build-seo-tags.util";
