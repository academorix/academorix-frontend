/**
 * @file resolver.interface.ts
 * @module @stackra/support/interfaces
 * @description The generic resolver contract consumed by {@link ResolverChain}.
 *
 *   A resolver knows how to turn a `key` (plus optional extra arguments)
 *   into a value of type `T`. Returning `undefined` signals "not my
 *   concern" so the chain moves on to the next entry.
 */

/**
 * Generic resolver contract.
 *
 * Resolves a value of type `T` from a `key` string. Returns `undefined`
 * when the resolver cannot handle the key so a {@link ResolverChain}
 * can fall through to the next resolver in priority order.
 *
 * @typeParam T - The resolved value type.
 */
export interface IResolver<T = unknown> {
  /** Resolve a value from the given key, or return `undefined` to pass. */
  resolve(key: string, ...args: unknown[]): T | undefined;
}
