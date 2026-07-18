/**
 * @file resolver-chain.ts
 * @module @stackra/support
 * @description Ordered chain of resolvers executed until one returns a value.
 *
 *   Used by the navigation system's icon resolver and other packages
 *   needing priority-ordered fallback resolution. Resolvers are
 *   registered with a numeric priority; the first resolver to return a
 *   non-`undefined` value wins.
 */

import type { IResolver } from "../interfaces";

// ============================================================================
// Chain
// ============================================================================

/** Internal entry with priority. */
interface IChainEntry<T> {
  /** The resolver instance. */
  resolver: IResolver<T>;
  /** Priority for ordering (lower runs first). */
  priority: number;
}

/**
 * Ordered chain of resolvers executed until one returns a value.
 *
 * @example
 * ```typescript
 * import { ResolverChain } from '@stackra/support';
 *
 * const chain = new ResolverChain<ReactNode>();
 * chain.register(lucideResolver, 10);
 * chain.register(customResolver, 20);
 * const icon = chain.resolve('home');
 * ```
 *
 * @typeParam T - The value type produced by every resolver in this chain.
 */
export class ResolverChain<T = unknown> {
  /** Internal list of entries, kept sorted lazily via `dirty`. */
  private entries: IChainEntry<T>[] = [];

  /** Whether the chain needs re-sorting before the next resolve. */
  private dirty = false;

  /**
   * Register a resolver with a priority.
   *
   * @param resolver - The resolver to register.
   * @param priority - Priority (lower runs first). Defaults to `50`.
   */
  public register(resolver: IResolver<T>, priority = 50): void {
    this.entries.push({ resolver, priority });
    // Mark the chain dirty — sorting is deferred until the next
    // `resolve` call to avoid quadratic behaviour when many resolvers
    // register in a tight loop.
    this.dirty = true;
  }

  /**
   * Resolve a value by running resolvers in priority order until one
   * returns a non-`undefined` value.
   *
   * @param key - The key to resolve.
   * @param args - Additional arguments forwarded to every resolver.
   * @returns The resolved value, or `undefined` when no resolver matched.
   */
  public resolve(key: string, ...args: unknown[]): T | undefined {
    if (this.dirty) {
      this.entries.sort((a, b) => a.priority - b.priority);
      this.dirty = false;
    }

    for (const entry of this.entries) {
      const result = entry.resolver.resolve(key, ...args);
      if (result !== undefined) return result;
    }
    return undefined;
  }
}

// Re-export IResolver from its canonical home so consumers who only
// import from this module can still reach the interface.
export type { IResolver } from "../interfaces";
