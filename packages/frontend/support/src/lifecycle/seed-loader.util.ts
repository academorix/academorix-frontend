/**
 * @file seed-loader.ts
 * @module @stackra/support/lifecycle
 * @description Canonical lifecycle seed loader for module `forFeature(...)`
 *   registration across the monorepo.
 *
 *   Per the module-lifecycle rules, `forFeature` must NOT run a side
 *   effect inside a `useFactory` that returns a sentinel
 *   (`return null` / `return true`). Instead the factory returns an
 *   object implementing `onApplicationBootstrap`; the container's
 *   instance loader duck-types it and invokes the hook in the proper
 *   lifecycle phase — after every module's `onModuleInit`.
 *
 * @example
 * ```typescript
 * import { createSeedLoader, seedLoaderToken } from '@stackra/support';
 *
 * {
 *   provide: seedLoaderToken('cache-store'),
 *   useFactory: (manager: CacheManager, store: ICacheStore) =>
 *     createSeedLoader(() => manager.extend('redis', () => store)),
 *   inject: [CacheManager, RedisStore],
 * }
 * ```
 */

import type { SeedLoader } from "../interfaces";

/**
 * Mint a unique DI token per `forFeature` call.
 *
 * The container is last-wins per token (no multi-providers), so a
 * shared token would drop every contribution but the last —
 * uniqueness keeps them all.
 *
 * @param name - Human-readable prefix for debugging.
 * @returns A brand-new unique `Symbol`.
 */
export function seedLoaderToken(name: string): symbol {
  return Symbol(`stackra:seed-loader:${name}`);
}

/**
 * Wrap a side-effecting function as an `onApplicationBootstrap` loader.
 *
 * @param fn - The seeding work to run after every module has wired.
 * @returns A {@link SeedLoader}.
 */
export function createSeedLoader(fn: () => unknown): SeedLoader {
  return {
    onApplicationBootstrap(): void | Promise<void> {
      // The seed callback's return value is discarded — accepting
      // `unknown` lets call-sites pass expression-bodied arrows (e.g.
      // `() => manager.extend(...)`) without TS flagging the non-void
      // return against this hook's `void | Promise<void>` union.
      const result = fn();
      if (result instanceof Promise) return result as Promise<void>;
    },
  };
}

// Re-export SeedLoader from its canonical home so consumers who only
// import from this module can still reach the type.
export type { SeedLoader } from "../interfaces";
