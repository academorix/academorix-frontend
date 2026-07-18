/**
 * @file index.ts
 * @module @stackra/support/utils
 * @description Public API barrel for stand-alone utility functions.
 *
 *   Pure, side-effect-free helpers — no classes, no DI, no state. Each
 *   function is a single-purpose primitive callers compose freely.
 */

/** @deprecated Use `registerAs` from `@stackra/config`. Removed in v0.2. */
export { createDefineConfig } from "./create-define-config.util";
/** @deprecated Use `registerAs` from `@stackra/config`. Removed in v0.2. */
export { defineConfig } from "./define-config.util";
export { isBuildTime } from "./is-build-time";
export { once } from "./once.util";
export { optional } from "./optional.util";
export { retry } from "./retry.util";
export { sleep } from "./sleep.util";
export { tap } from "./tap.util";
export { timebox } from "./timebox.util";
export type { PartialType, PickType, OmitType, IntersectionType } from "./mapped-types";
