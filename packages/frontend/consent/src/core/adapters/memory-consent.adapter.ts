/**
 * @file memory-consent.adapter.ts
 * @module @stackra/consent/core/adapters
 * @description In-memory consent storage adapter for testing and SSR contexts.
 *   Stores preferences in a plain object — no persistence across reloads.
 */

import { Injectable } from '@stackra/container';
import type { IConsentStorageAdapter } from '@stackra/contracts';

/**
 * In-memory consent storage adapter.
 *
 * Useful for unit/integration tests, SSR environments (no `localStorage`),
 * or when persistence is handled externally.
 *
 * @example
 * ```typescript
 * const adapter = new MemoryConsentAdapter();
 * await adapter.save({ analytics: true });
 * const prefs = await adapter.load(); // { analytics: true }
 * ```
 */
@Injectable()
export class MemoryConsentAdapter implements IConsentStorageAdapter {
  /** Internal memory store. */
  private store: Record<string, boolean> | null = null;

  /**
   * Load persisted consent preferences from memory.
   *
   * @returns The stored preferences map, or `null` if none exist.
   */
  public async load(): Promise<Record<string, boolean> | null> {
    return this.store ? { ...this.store } : null;
  }

  /**
   * Persist consent preferences in memory.
   *
   * @param prefs - The preferences map to store.
   */
  public async save(prefs: Record<string, boolean>): Promise<void> {
    this.store = { ...prefs };
  }

  /** Clear all persisted consent data from memory. */
  public async clear(): Promise<void> {
    this.store = null;
  }
}
