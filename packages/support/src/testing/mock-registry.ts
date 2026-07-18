/**
 * @file mock-registry.ts
 * @module @stackra/support/testing
 * @description Concrete `BaseRegistry<K, V>` subclass useful when tests
 *   want a working strict-by-default registry without extending the
 *   abstract class themselves.
 *
 *   Records every register / replace / remove mutation on `.mutations`
 *   so tests can assert on order and count without hooking every
 *   lifecycle callback.
 */

import { BaseRegistry } from "../registries/base.registry";

/** A recorded mutation on a `MockRegistry`. */
export type RegistryMutation<K, V> =
  | { kind: "register"; key: K; value: V }
  | { kind: "replace"; key: K; value: V }
  | { kind: "remove"; key: K; value: V };

/**
 * A working `BaseRegistry<K, V>` for tests.
 *
 * Retains full strict-by-default semantics from `BaseRegistry` but
 * additionally records every mutation for assertions.
 *
 * @example
 * ```ts
 * const registry = new MockRegistry<string, number>();
 * registry.register('a', 1);
 * registry.replace('a', 2);
 * registry.remove('a');
 * expect(registry.mutations.map((m) => m.kind)).toEqual([
 *   'register', 'replace', 'remove',
 * ]);
 * ```
 */
export class MockRegistry<K, V> extends BaseRegistry<K, V> {
  /** Every mutation in order. */
  public readonly mutations: RegistryMutation<K, V>[] = [];

  public constructor(seed?: Iterable<readonly [K, V]>) {
    super();
    for (const [key, value] of seed ?? []) {
      // Bypass mutation logging when seeding so tests see only their
      // own mutations after construction.
      this.items.set(key, value);
    }
  }

  public override register(key: K, value: V): this {
    super.register(key, value);
    this.mutations.push({ kind: "register", key, value });
    return this;
  }

  public override replace(key: K, value: V): this {
    const existed = this.has(key);
    super.replace(key, value);
    this.mutations.push({ kind: existed ? "replace" : "register", key, value });
    return this;
  }

  public override remove(key: K): boolean {
    const prev = this.get(key);
    const removed = super.remove(key);
    if (removed) this.mutations.push({ kind: "remove", key, value: prev as V });
    return removed;
  }

  // ── Test hooks ────────────────────────────────────────────────────────

  /** Drop mutation history without touching stored entries. */
  public resetMutations(): void {
    this.mutations.length = 0;
  }
}
