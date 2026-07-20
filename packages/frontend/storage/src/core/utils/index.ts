/**
 * @file index.ts
 * @module @stackra/storage/core/utils
 * @description Barrel export for storage utility helpers.
 */

export { defineConfig } from "./define-config.util";
export { mergeConfig } from "./merge-config.util";
export { prefixKey, stripPrefix } from "./prefix-key.util";
export { wrapTtl, unwrapTtl, isExpired, type TtlEnvelope } from "./ttl-envelope.util";
