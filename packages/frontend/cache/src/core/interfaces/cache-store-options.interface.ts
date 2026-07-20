/**
 * Options stored by the `@CacheStore()` decorator.
 */
export interface ICacheStoreOptions {
  /** Unique name for this store (used as key in CacheManager). */
  readonly name: string;
  /** Driver identifier for this store. */
  readonly driver: string;
  /** Store-specific configuration. */
  readonly config?: Record<string, unknown>;
}
