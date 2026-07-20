/**
 * @file index.ts
 * @module @stackra/storage/core
 * @description Public API for `@stackra/storage`. Platform-agnostic
 *   surface: the manager, module, config trio, cross-platform stores,
 *   errors, and decorators.
 *
 *   Platform-specific stores live under `@stackra/storage/react`
 *   and `@stackra/storage/native`; testing helpers under
 *   `@stackra/storage/testing`.
 */

// Module + services
export { StorageModule } from "./storage.module";
export { StorageManager } from "./services";

// Cross-platform stores
export { MemoryStore, NullStore } from "./stores";

// Constants
export { DEFAULT_STORAGE_CONFIG } from "./constants";

// Utils — config trio + envelope + prefix helpers
export {
  defineConfig,
  mergeConfig,
  prefixKey,
  stripPrefix,
  wrapTtl,
  unwrapTtl,
  isExpired,
  type TtlEnvelope,
} from "./utils";

// Errors
export { StorageError, StorageDriverError } from "./errors";

// Decorators
export { StorageDriver, STORAGE_DRIVER_METADATA_KEY } from "./decorators";
