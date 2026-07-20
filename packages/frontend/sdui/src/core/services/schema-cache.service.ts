/**
 * @file schema-cache.service.ts
 * @module @stackra/sdui/core/services
 * @description SchemaCache — in-memory ETag-aware cache of loaded
 *   screens. Layered over `@stackra/cache` in a future minor bump;
 *   ships as a plain `Map` today so the runtime works stand-alone.
 */

import { Injectable } from "@stackra/container";
import type { ISduiScreen } from "@stackra/contracts";

interface ICacheEntry {
  readonly screen: ISduiScreen;
  readonly etag?: string;
  readonly expiresAt: number;
}

/**
 * SchemaCache — TTL-bounded in-memory store of `{ screen, etag }` pairs
 * keyed by a caller-supplied string (typically the URL path or a
 * `resource:view` composite).
 */
@Injectable()
export class SchemaCache {
  private readonly store = new Map<string, ICacheEntry>();
  private ttlMs = 60 * 60 * 1_000; // 1 hour default

  /** Adjust the default TTL (in seconds). Setting `0` disables caching. */
  public setTtlSeconds(seconds: number): void {
    this.ttlMs = Math.max(0, seconds * 1_000);
  }

  /** Read a cached screen (and its ETag). Returns `undefined` if expired. */
  public get(key: string): { screen: ISduiScreen; etag?: string } | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (this.ttlMs > 0 && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return { screen: entry.screen, etag: entry.etag };
  }

  /** Store a screen with an optional ETag. */
  public set(key: string, screen: ISduiScreen, etag?: string): void {
    if (this.ttlMs === 0) return;
    this.store.set(key, { screen, etag, expiresAt: Date.now() + this.ttlMs });
  }

  /** Invalidate one entry. Returns `true` when it existed. */
  public invalidate(key: string): boolean {
    return this.store.delete(key);
  }

  /** Clear every cached entry. */
  public clear(): void {
    this.store.clear();
  }

  /** Total cached entries. */
  public size(): number {
    return this.store.size;
  }
}
