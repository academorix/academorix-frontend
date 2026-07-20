/**
 * @file seed-loader.interface.ts
 * @module @stackra/support/interfaces
 * @description The lifecycle-loader shape returned by `createSeedLoader`.
 *
 *   The DI container's instance loader duck-types every resolved
 *   provider; anything implementing `onApplicationBootstrap` gets that
 *   hook called after all `onModuleInit` hooks have run. Feature
 *   modules take advantage of this to seed additional entries into a
 *   registry from `forFeature(...)` without a bootstrap-class.
 */

/**
 * The lifecycle-loader shape returned by `createSeedLoader`.
 *
 * The container recognises any provider carrying this method and
 * invokes it in the `onApplicationBootstrap` phase.
 */
export interface SeedLoader {
  /** Run the deferred seeding work. May be async. */
  onApplicationBootstrap(): void | Promise<void>;
}
