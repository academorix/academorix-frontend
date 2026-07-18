/**
 * @file index.ts
 * @module @stackra/cache/core
 * @description Public API for the cache core module.
 *   Re-exports all public symbols organized by category.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { CacheModule } from "./cache.module";
export type { ICacheModuleAsyncOptions } from "./interfaces";

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export { CacheManager } from "./services";
export { CacheService } from "./services";
export { CacheStoreLoader } from "./services";

// ════════════════════════════════════════════════════════════════════════════════
// Stores
// ════════════════════════════════════════════════════════════════════════════════
export { MemoryStore } from "./stores";
export { NullStore } from "./stores";
export { StorageStore } from "./stores";
export type { IStorageStoreOptions } from "./interfaces";

// ════════════════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════════════════
export { CacheError } from "./errors";
export { CacheDriverError } from "./errors";

// ════════════════════════════════════════════════════════════════════════════════
// Tags
// ════════════════════════════════════════════════════════════════════════════════
export { TagSet } from "./tags";
export { TaggedCache } from "./tags";

// ════════════════════════════════════════════════════════════════════════════════
// Decorators
// ════════════════════════════════════════════════════════════════════════════════
export { CacheStore } from "./decorators";
export { Cacheable, setCacheableContainer } from "./decorators";
export { CacheEvict, setCacheEvictContainer } from "./decorators";

// ════════════════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════════════════
/** @deprecated Use `registerAs` from `@stackra/config`. Removed in v0.2. */
export { defineConfig } from "./utils";

// ════════════════════════════════════════════════════════════════════════════════
// Deprecation-shim re-export — lets consumers migrating a single
// file `import { registerAs } from '@stackra/cache'` for one release
// cycle without changing the import path. Removed in v0.2; switch
// to `import { registerAs } from '@stackra/config'` at your own
// pace.
// ════════════════════════════════════════════════════════════════════════════════
/** @deprecated Import `registerAs` directly from `@stackra/config`. Removed in v0.2. */
export { registerAs } from "@stackra/config";

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════
export { DEFAULT_TTL, DEFAULT_PREFIX, DEFAULT_STORE } from "./constants";

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════════════════════════
export type { ICacheModuleConfig, ICacheStoreConfig } from "./interfaces";
