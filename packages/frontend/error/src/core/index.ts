/**
 * @file index.ts
 * @module @stackra/error/core
 * @description Framework-agnostic error primitives — normalisation,
 *   serialisation, and shared constants. No React dependency.
 */

export { normalizeError } from "./utils/normalize-error.util";
export { serializeError } from "./utils/serialize-error.util";
export type { SerializedError } from "./types/serialized-error.type";
