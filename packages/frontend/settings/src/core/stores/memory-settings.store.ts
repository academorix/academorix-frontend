/**
 * @file memory-settings.store.ts
 * @module @stackra/settings/core/stores
 * @description In-process `Map`-backed settings store.
 *
 *   Values are lost on reload. Useful for tests, SSR bootstrap, and
 *   as the fallback when no persistent store is configured.
 */

import type { ISettingsStore } from '@stackra/contracts';

/**
 * In-memory settings store.
 *
 * Synchronous — the service's sync `get()` path resolves against this
 * without touching a promise.
 */
export class MemorySettingsStore implements ISettingsStore {
  /** Driver identifier surfaced by `ISettingsStore`. */
  public readonly driver = 'memory';

  /** Values keyed by group key. */
  private readonly data = new Map<string, Record<string, unknown>>();

  /** @inheritDoc */
  public load(groupKey: string): Record<string, unknown> {
    return this.data.get(groupKey) ?? {};
  }

  /** @inheritDoc */
  public save(groupKey: string, values: Record<string, unknown>): void {
    // Clone on write so the caller can safely keep mutating the input
    // reference without leaking mutations into the store.
    this.data.set(groupKey, { ...values });
  }

  /** @inheritDoc */
  public clear(groupKey: string): void {
    this.data.delete(groupKey);
  }

  /**
   * @inheritDoc
   *
   * @remarks Returns every group the in-memory `Map` currently
   *   holds — nothing more the driver can look up. Called by
   *   `SettingsService.loadAll()` when this is the default store.
   */
  public async loadAll(): Promise<Record<string, Record<string, unknown>>> {
    const out: Record<string, Record<string, unknown>> = {};
    // Clone each entry so the caller can freeze / mutate without
    // leaking back into the store.
    for (const [key, values] of this.data) {
      out[key] = { ...values };
    }
    return out;
  }
}
