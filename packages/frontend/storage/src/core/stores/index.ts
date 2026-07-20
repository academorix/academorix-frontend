/**
 * @file index.ts
 * @module @stackra/storage/core/stores
 * @description Barrel export for the cross-platform stores shipped
 *   inside `@stackra/storage/core`. Platform-specific stores live
 *   under `./react/stores` and `./native/stores`.
 */

export { MemoryStore } from "./memory.store";
export { NullStore } from "./null.store";
