/**
 * @file mock-state-registry.ts
 * @module @stackra/state/testing
 * @description In-memory `StateRegistry`-compatible mock for tests.
 *
 *   Mirrors the `StateRegistry` public surface (`registerStore`, `get`,
 *   `getAll`, `getNames`, `snapshot`) without the DI/`BaseRegistry`
 *   machinery, so tests can register stores and assert introspection
 *   deterministically.
 */

import type { Store } from '@tanstack/store';

/** Metadata entry for a registered store (mirrors the runtime `StoreEntry`). */
export interface MockStoreEntry {
  readonly name: string;
  readonly token: symbol;
  readonly store: Store<unknown>;
  readonly initialState?: unknown;
}

/**
 * In-memory store registry for testing.
 *
 * Register under `STATE_REGISTRY` (or the `StateRegistry` class token) in
 * tests that need store introspection without a full container wire-up.
 */
export class MockStateRegistry {
  /** In-memory store index. */
  private readonly entries = new Map<string, MockStoreEntry>();

  /** Register a store in the mock registry. */
  public registerStore(
    name: string,
    token: symbol,
    store: Store<unknown>,
    initialState?: unknown
  ): void {
    this.entries.set(name, { name, token, store, initialState });
  }

  /** Get a single store entry by name. */
  public get(name: string): MockStoreEntry | undefined {
    return this.entries.get(name);
  }

  /** Get every registered store entry. */
  public getAll(): MockStoreEntry[] {
    return Array.from(this.entries.values());
  }

  /** Get every registered store name. */
  public getNames(): string[] {
    return Array.from(this.entries.keys());
  }

  /** Resolve a store's name from its DI token. */
  public getNameByToken(token: symbol): string | undefined {
    for (const entry of this.entries.values()) {
      if (entry.token === token) return entry.name;
    }
    return undefined;
  }

  /** Snapshot every store's current state. */
  public snapshot(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const entry of this.entries.values()) {
      result[entry.name] = entry.store.state;
    }
    return result;
  }

  /** Remove every registered store. */
  public clear(): void {
    this.entries.clear();
  }
}
