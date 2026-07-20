/**
 * @file indexed-db.store.ts
 * @module @stackra/storage/react/stores
 * @description `IStorage` backed by IndexedDB via Dexie. Chosen for
 *   the offline-first use case where localStorage's 5MB cap is too
 *   small, or where structured (non-string) values are worth
 *   avoiding the JSON round-trip.
 */

import type { IStorage, IStorageSetOptions } from "@stackra/contracts";

import { isExpired, type TtlEnvelope } from "@/core/utils/ttl-envelope.util";

// Type-only import — Dexie is an OPTIONAL peer. The runtime import
// below is dynamic so importing this file never pulls in Dexie unless
// the caller actually constructs an `IndexedDbStore`.
import type { Dexie, Table } from "dexie";

/**
 * Constructor config for {@link IndexedDbStore}.
 */
export interface IndexedDbStoreConfig {
  /**
   * IndexedDB database name.
   *
   * @default 'stackra-storage'
   */
  readonly database?: string;

  /**
   * Object-store (Dexie table) name inside the database.
   *
   * @default 'kv'
   */
  readonly tableName?: string;
}

/**
 * Shape of every row persisted by this store.
 *
 * `k` is the primary key; `v` is the payload; `e` is the optional
 * expiration timestamp (matches the {@link TtlEnvelope} shape used
 * by JSON-serialised drivers).
 */
interface IndexedDbRow {
  /** Primary key. */
  readonly k: string;
  /** Payload. */
  readonly v: unknown;
  /** Optional expiration epoch milliseconds. */
  readonly e?: number;
}

/**
 * `IStorage` implementation persisting to IndexedDB via Dexie.
 *
 * Dexie is loaded lazily via a dynamic `import('dexie')` on the
 * first store operation — the class itself is import-safe when Dexie
 * isn't installed. Any read/write call throws with an actionable
 * error message when Dexie is missing at runtime.
 *
 * @example
 * ```typescript
 * // Registered by WebStorageModule when the caller declares an
 * // instance with driver: 'indexedDB':
 * WebStorageModule.forRoot({
 *   default: 'offline',
 *   stores: {
 *     offline: { driver: 'indexedDB', database: 'app-offline', tableName: 'kv' },
 *   },
 * });
 * ```
 */
export class IndexedDbStore implements IStorage {
  private readonly databaseName: string;
  private readonly tableName: string;

  /** Lazy — created on first operation. */
  private ready: Promise<Table<IndexedDbRow, string>> | null = null;

  /**
   * @param config - Optional overrides for database + table name.
   */
  public constructor(config: IndexedDbStoreConfig = {}) {
    this.databaseName = config.database ?? "stackra-storage";
    this.tableName = config.tableName ?? "kv";
  }

  // ── IStorage ─────────────────────────────────────────────────────

  /** @inheritdoc */
  public async get<T>(key: string): Promise<T | null> {
    try {
      const table = await this.table();
      const row = await table.get(key);
      if (!row) return null;
      if (isExpired({ v: row.v, e: row.e })) {
        // Passive expiration.
        await table.delete(key);
        return null;
      }
      return row.v as T;
    } catch {
      // fail-soft — IndexedDB blocked / unavailable / quota exceeded.
      return null;
    }
  }

  /** @inheritdoc */
  public async set<T>(key: string, value: T, options?: IStorageSetOptions): Promise<void> {
    try {
      const table = await this.table();
      const row: IndexedDbRow = {
        k: key,
        v: value,
        ...(options?.ttlSeconds && options.ttlSeconds > 0
          ? { e: Date.now() + options.ttlSeconds * 1000 }
          : {}),
      };
      await table.put(row);
    } catch {
      // fail-soft.
    }
  }

  /** @inheritdoc */
  public async delete(key: string): Promise<void> {
    try {
      const table = await this.table();
      await table.delete(key);
    } catch {
      // fail-soft.
    }
  }

  /** @inheritdoc */
  public async clear(): Promise<void> {
    try {
      const table = await this.table();
      await table.clear();
    } catch {
      // fail-soft.
    }
  }

  /** @inheritdoc */
  public async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  /** @inheritdoc */
  public async keys(): Promise<string[]> {
    try {
      const table = await this.table();
      // Iterate + filter out expired rows in a single pass — this
      // also cleans up stale entries opportunistically.
      const live: string[] = [];
      const expired: string[] = [];
      await table.each((row) => {
        if (isExpired({ v: row.v, e: row.e })) {
          expired.push(row.k);
          return;
        }
        live.push(row.k);
      });
      if (expired.length > 0) await table.bulkDelete(expired);
      return live;
    } catch {
      // fail-soft.
      return [];
    }
  }

  // ── Internal ─────────────────────────────────────────────────────

  /**
   * Resolve (and cache) the Dexie table, dynamic-importing Dexie on
   * first call. This is the one place Dexie is required at runtime —
   * consumers who never construct an `IndexedDbStore` never load it.
   */
  private table(): Promise<Table<IndexedDbRow, string>> {
    if (this.ready) return this.ready;

    this.ready = (async () => {
      let DexieCtor: typeof Dexie;
      try {
        const mod = await import("dexie");
        // Handle both ESM default and CJS module.exports shapes.
        DexieCtor = (mod.default ??
          (mod as unknown as { Dexie: typeof Dexie }).Dexie) as typeof Dexie;
      } catch (cause) {
        throw new Error(
          "[@stackra/storage] IndexedDbStore requires the `dexie` peer. " +
            "Install it with `pnpm add dexie`.",
          { cause: cause as Error },
        );
      }

      const db = new DexieCtor(this.databaseName);
      // Single-version schema for v1 — `k` as the primary key.
      db.version(1).stores({ [this.tableName]: "k" });
      // Cast is safe: we defined the schema above.
      return db.table<IndexedDbRow, string>(this.tableName);
    })();

    return this.ready;
  }
}
