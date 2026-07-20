/**
 * @file cache-config.interface.ts
 * @module @stackra/cache/core/interfaces
 * @description Interfaces for the cache module configuration and store contracts.
 *   Defines the shape of cache stores, module config, and individual store config.
 */

/**
 * Cache module configuration.
 *
 * Defines which stores are available, which is the default,
 * and global settings like prefix and TTL.
 */
export interface ICacheModuleConfig {
  /** Name of the default store to use when none is specified. */
  default: string;

  /** Map of store name to its configuration. */
  stores: Record<string, ICacheStoreConfig>;

  /** Global key prefix applied to all stores. */
  prefix?: string;

  /** Global default TTL in seconds. */
  ttl?: number;
}

/**
 * Configuration for a single cache store.
 *
 * The `driver` field determines which store implementation is used.
 * Additional fields are driver-specific.
 */
export interface ICacheStoreConfig {
  /** Driver name (e.g., 'memory', 'null', 'redis'). */
  driver: string;

  /** Store-specific TTL override in seconds. */
  ttl?: number;

  /** Store-specific key prefix. */
  prefix?: string;

  /** Allow additional driver-specific options. */
  [key: string]: unknown;
}
