/**
 * @file state.registry.ts
 * @module @stackra/state/core/registries
 * @description Central registry of every DI-managed reactive store.
 *
 *   Extends `BaseRegistry<string, StoreEntry>` from `@stackra/support` to
 *   track all stores registered via `StateModule.forFeature()`. The registry
 *   does NOT own the stores — they live in the DI container. It is a metadata
 *   index for devtools, debugging, and runtime store discovery.
 */

import { Injectable } from '@stackra/container';
import { BaseRegistry } from '@stackra/support';
import type { Store } from '@tanstack/store';

/**
 * Metadata entry for a registered store.
 */
export interface StoreEntry {
  /** Human-readable name for devtools display. */
  readonly name: string;
  /** The DI token (Symbol) this store is registered under. */
  readonly token: symbol;
  /** Reference to the actual Store instance. */
  readonly store: Store<unknown>;
  /** The initial state used to create the store (for reset operations). */
  readonly initialState?: unknown;
}

/**
 * Central registry of all reactive stores in the application.
 *
 * Populated automatically by `StateModule.forFeature()`. Use for:
 * - Devtools introspection (list all stores and their current state)
 * - Debugging (snapshot all state at a point in time)
 * - Testing (verify stores are registered correctly)
 *
 * @example
 * ```typescript
 * const registry = useInject<StateRegistry>(STATE_REGISTRY);
 *
 * for (const entry of registry.getAll()) {
 *   console.log(entry.name, entry.store.state);
 * }
 *
 * const snapshot = registry.snapshot();
 * // { i18n: { locale: "en" }, theme: { mode: "dark" } }
 * ```
 */
@Injectable()
export class StateRegistry extends BaseRegistry<string, StoreEntry> {
  /**
   * Register a store in the registry.
   *
   * Called automatically by `StateModule.forFeature()`. Uses
   * overwrite semantics so re-registering a store name (hot reload,
   * test re-wiring) doesn't throw.
   *
   * @param name - Human-readable store name (e.g. "i18n", "theme").
   * @param token - The DI token (Symbol) for the store.
   * @param store - The Store instance.
   * @param initialState - The initial state (for reset operations).
   */
  public registerStore(
    name: string,
    token: symbol,
    store: Store<unknown>,
    initialState?: unknown
  ): void {
    this.replace(name, { name, token, store, initialState });
  }

  /**
   * Get every registered store entry.
   *
   * @returns Array of store entries in registration order.
   */
  public getAll(): StoreEntry[] {
    return this.values();
  }

  /**
   * Get every registered store name.
   *
   * @returns Array of store names.
   */
  public getNames(): string[] {
    return this.keys();
  }

  /**
   * Resolve a store's name from its DI token.
   *
   * Centralizes the token→name reverse lookup that read/write hooks need
   * for event emission, so callers never re-implement it.
   *
   * @param token - The DI token (Symbol) the store was registered under.
   * @returns The store name, or `undefined` when no store matches.
   */
  public getNameByToken(token: symbol): string | undefined {
    for (const entry of this.values()) {
      if (entry.token === token) return entry.name;
    }
    return undefined;
  }

  /**
   * Snapshot every store's current state.
   *
   * @returns Object mapping store names to their current state.
   *
   * @example
   * ```typescript
   * const snapshot = registry.snapshot();
   * // { i18n: { locale: "en", dir: "ltr" }, theme: { mode: "dark" } }
   * ```
   */
  public snapshot(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const entry of this.values()) {
      result[entry.name] = entry.store.state;
    }
    return result;
  }
}
