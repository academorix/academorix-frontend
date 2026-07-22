/**
 * @file checkpoint.service.ts
 * @module @stackra/sync/core/services
 * @description CheckpointService — persists per-collection sync
 *   state through `@stackra/storage` so the engine can resume where
 *   it left off after a page refresh or crash.
 *
 *   Composes over the `indexedDB` `IStorage` instance by default —
 *   apps configure that instance's actual driver (Dexie IndexedDB
 *   in production, `memory` in tests / SSR) via
 *   `WebStorageModule.forRoot({ stores: { indexedDB: {...} } })`.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import {
  STORAGE_MANAGER,
  SYNC_CONFIG,
  type ISyncCheckpoint,
  type ISyncModuleOptions,
  type IStorage,
  type IStorageManager,
} from "@stackra/contracts";
import { Logger } from "@stackra/logger";
import { Str } from "@stackra/support";

/** Key prefix for checkpoint entries inside the resolved `IStorage`. */
const KEY_PREFIX = "sync:checkpoint:";

/**
 * Default named `IStorage` instance to resolve when the caller
 * doesn't override via `ISyncModuleOptions.storage`.
 */
const DEFAULT_STORAGE_INSTANCE = "indexedDB";

/**
 * CheckpointService — `IStorage`-backed sync checkpoint persistence.
 *
 * The service is a thin KV wrapper: one storage key per collection
 * (`sync:checkpoint:${collection}`). Loading "all" checkpoints uses
 * `IStorage.keys()` and filters by the prefix.
 *
 * When no `StorageManager` is provided (test / SSR without
 * `WebStorageModule`), every operation resolves to a soft no-op —
 * consistent with the previous "IndexedDB unavailable" fail-soft
 * path.
 */
@Injectable()
export class CheckpointService {
  private readonly logger = new Logger(CheckpointService.name);
  private cached: IStorage | null = null;

  /** Resolved from `ISyncModuleOptions.storage`, defaulting to `indexedDB`. */
  private readonly instanceName: string;

  /**
   * @param manager - Optional `IStorageManager`. When absent,
   *   checkpoint persistence is disabled and every operation
   *   resolves to a fail-soft no-op.
   * @param options - Optional sync module config — reads the
   *   `storage` field for the named `IStorage` instance to resolve.
   */
  public constructor(
    @Optional() @Inject(STORAGE_MANAGER) private readonly manager?: IStorageManager,
    @Optional() @Inject(SYNC_CONFIG) options?: ISyncModuleOptions,
  ) {
    this.instanceName = options?.storage ?? DEFAULT_STORAGE_INSTANCE;
  }

  /** Save a checkpoint for a collection. */
  public async save(collection: string, checkpoint: ISyncCheckpoint): Promise<void> {
    const storage = this.getStorage();
    if (!storage) return;
    await storage.set(`${KEY_PREFIX}${collection}`, checkpoint);
  }

  /** Load the checkpoint for a specific collection. */
  public async load(collection: string): Promise<ISyncCheckpoint | null> {
    const storage = this.getStorage();
    if (!storage) return null;
    return (await storage.get<ISyncCheckpoint>(`${KEY_PREFIX}${collection}`)) ?? null;
  }

  /** Load every persisted checkpoint. */
  public async loadAll(): Promise<ISyncCheckpoint[]> {
    const storage = this.getStorage();
    if (!storage) return [];

    const keys = await storage.keys();
    const owned = keys.filter((k) => Str.startsWith(k, KEY_PREFIX));
    const results = await Promise.all(owned.map((k) => storage.get<ISyncCheckpoint>(k)));
    return results.filter((c): c is ISyncCheckpoint => c !== null);
  }

  /** Delete a single checkpoint. */
  public async delete(collection: string): Promise<void> {
    const storage = this.getStorage();
    if (!storage) return;
    await storage.delete(`${KEY_PREFIX}${collection}`);
  }

  /** Delete every persisted checkpoint. */
  public async deleteAll(): Promise<void> {
    const storage = this.getStorage();
    if (!storage) return;

    const keys = await storage.keys();
    const owned = keys.filter((k) => Str.startsWith(k, KEY_PREFIX));
    for (const key of owned) {
      await storage.delete(key);
    }
  }

  /**
   * Resolve (and cache) the underlying `IStorage`. Deferred so
   * platform modules that register drivers via `manager.extend(...)`
   * during `onApplicationBootstrap` get a chance to run first.
   */
  private getStorage(): IStorage | null {
    if (this.cached) return this.cached;
    if (!this.manager) {
      this.logger.warn(
        "[CheckpointService] STORAGE_MANAGER not provided — checkpoints disabled. " +
          "Import WebStorageModule / NativeStorageModule upstream with an " +
          `'${this.instanceName}' store to enable persistence.`,
      );
      return null;
    }
    try {
      this.cached = this.manager.instance(this.instanceName);
      return this.cached;
    } catch (error: unknown) {
      this.logger.warn(
        `[CheckpointService] IStorage instance '${this.instanceName}' not resolved — checkpoints disabled`,
        { error: String(error) },
      );
      return null;
    }
  }
}
