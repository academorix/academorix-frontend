/**
 * @file index.ts
 * @module @stackra/cache/core/interfaces
 * @description Barrel re-exports for the interfaces directory.
 */
export type { ICacheModuleConfig, ICacheStoreConfig } from "./cache-config.interface";
export type { ICacheModuleAsyncOptions } from "./cache-module-async-options.interface";
export type { ICacheStoreOptions } from "./cache-store-options.interface";
export type { ICacheEvictOptions } from "./cache-evict-options.interface";
export type { ICacheableOptions } from "./cacheable-options.interface";
export type { ICacheEntry } from "./cache-entry.interface";
export type { IStorageEntry } from "./storage-entry.interface";
export type { IStorageStoreOptions } from "./storage-store-options.interface";
