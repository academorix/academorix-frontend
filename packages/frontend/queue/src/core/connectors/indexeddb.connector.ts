/**
 * @file indexeddb.connector.ts
 * @module @stackra/queue/core/connectors
 * @description IndexedDB-backed queue connector. Composes over
 *   `@stackra/storage`'s manager — the `indexedDB` driver (Dexie
 *   under the hood) handles the actual persistence.
 *
 *   Queue semantics (FIFO ordering, per-queue max-entries eviction,
 *   ordered pop) layered ON TOP of `IStorage` — identical shape to
 *   the `LocalStorageConnection`, only the default instance name
 *   differs (`indexedDB` vs `localStorage`).
 *
 *   ## Trade-off
 *
 *   The previous raw-`IndexedDB` implementation used a compound
 *   index (`[queue, createdAt]`) for O(log n) pop. Composing over
 *   the KV-shaped `IStorage` gives us O(n) pop instead — the
 *   trade-off documented in
 *   `.kiro/audit/pattern-alignment-tasks-2026-07-14.md#p1e` in
 *   exchange for a unified backend that every queue driver shares.
 *   For queues over ~10k jobs, consider a custom driver registered
 *   via `StorageModule.forFeature`.
 */

import { Inject, Injectable } from "@stackra/container";
import { STORAGE_MANAGER, type IStorage, type IStorageManager } from "@stackra/contracts";
import { Str } from "@stackra/support";

import type {
  IJobOptions,
  IQueueConnection,
  IQueueConnectionConfig,
  IQueueConnector,
  IQueuedJob,
} from "@/core/interfaces";
import { generateJobId } from "@/core/utils/job-helpers.util";

// ════════════════════════════════════════════════════════════════════════════════
// Connection
// ════════════════════════════════════════════════════════════════════════════════

/**
 * IndexedDB-backed queue connection.
 *
 * Kept as its own class (rather than a subclass of
 * `LocalStorageConnection`) so users who explicitly configure
 * `driver: 'indexeddb'` on `QueueModule.forRoot(...)` get an
 * instance with the correct default backing.
 */
export class IndexedDBConnection implements IQueueConnection {
  /** Key prefix for all queue entries. */
  private readonly prefix: string;

  /** Maximum entries to retain per queue. */
  private readonly maxEntries: number;

  /** Named `IStorage` instance to resolve from the manager. */
  private readonly instanceName: string;

  /** Lazy — resolved on first access. */
  private cached: IStorage | null = null;

  /**
   * @param manager - The resolved `IStorageManager`.
   * @param config - Per-connection config (prefix, maxEntries,
   *   storage instance name — defaults to `'indexedDB'`).
   */
  public constructor(
    private readonly manager: IStorageManager,
    config: IQueueConnectionConfig,
  ) {
    this.prefix = (config.prefix as string | undefined) ?? "queue:";
    this.maxEntries = (config.maxEntries as number | undefined) ?? 1000;
    this.instanceName = (config.storage as string | undefined) ?? "indexedDB";
  }

  /** @inheritdoc */
  public async push<T>(name: string, data: T, options?: IJobOptions): Promise<string> {
    const queueName = options?.queue ?? "default";
    const id = generateJobId();
    const job: IQueuedJob<T> = {
      id,
      name,
      data,
      attempts: 0,
      maxAttempts: options?.tries ?? 1,
      queue: queueName,
      createdAt: Date.now(),
    };

    await this.storeJob(queueName, job);
    await this.enforceLimit(queueName);
    return id;
  }

  /** @inheritdoc */
  public async later<T>(
    _delayMs: number,
    name: string,
    data: T,
    options?: IJobOptions,
  ): Promise<string> {
    // The `IStorage` layer doesn't offer scheduled delivery — the
    // job is written now and picked up by the next `pop`.
    return this.push(name, data, options);
  }

  /** @inheritdoc */
  public async bulk<T>(
    jobs: Array<{ name: string; data: T; options?: IJobOptions }>,
  ): Promise<string[]> {
    const ids: string[] = [];
    for (const job of jobs) {
      ids.push(await this.push(job.name, job.data, job.options));
    }
    return ids;
  }

  /** @inheritdoc */
  public async pop(queue: string = "default"): Promise<IQueuedJob | null> {
    const jobs = await this.getJobs(queue);
    if (jobs.length === 0) return null;

    // Sort by createdAt (FIFO — oldest first).
    jobs.sort((a, b) => a.createdAt - b.createdAt);
    const oldest = jobs[0]!;

    await this.removeJob(queue, oldest.id);
    return oldest;
  }

  /** @inheritdoc */
  public async size(queue: string = "default"): Promise<number> {
    return (await this.getJobs(queue)).length;
  }

  /** @inheritdoc */
  public async remove(jobId: string): Promise<void> {
    const queueKeys = await this.getAllQueueKeys();
    for (const key of queueKeys) {
      const queueName = key.slice(this.prefix.length);
      await this.removeJob(queueName, jobId);
    }
  }

  /** @inheritdoc */
  public async pause(_queue?: string): Promise<void> {
    /* no-op */
  }

  /** @inheritdoc */
  public async resume(_queue?: string): Promise<void> {
    /* no-op */
  }

  /** @inheritdoc */
  public async clear(queue: string = "default"): Promise<void> {
    await this.storage().delete(this.getKey(queue));
  }

  /** @inheritdoc */
  public async close(): Promise<void> {
    /* no-op — the storage layer stays alive across connections. */
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Resolve (and cache) the underlying `IStorage`. Deferred so
   * platform modules that register drivers via `manager.extend(...)`
   * during `onApplicationBootstrap` get a chance to run first.
   */
  private storage(): IStorage {
    if (this.cached) return this.cached;
    this.cached = this.manager.instance(this.instanceName);
    return this.cached;
  }

  private getKey(queue: string): string {
    return `${this.prefix}${queue}`;
  }

  private async getJobs(queue: string): Promise<IQueuedJob[]> {
    return (await this.storage().get<IQueuedJob[]>(this.getKey(queue))) ?? [];
  }

  private async storeJob(queue: string, job: IQueuedJob): Promise<void> {
    const jobs = await this.getJobs(queue);
    jobs.push(job);
    await this.storage().set(this.getKey(queue), jobs);
  }

  private async removeJob(queue: string, jobId: string): Promise<void> {
    const jobs = await this.getJobs(queue);
    const filtered = jobs.filter((j) => j.id !== jobId);
    if (filtered.length !== jobs.length) {
      await this.storage().set(this.getKey(queue), filtered);
    }
  }

  private async enforceLimit(queue: string): Promise<void> {
    const jobs = await this.getJobs(queue);
    if (jobs.length <= this.maxEntries) return;
    const trimmed = jobs.slice(jobs.length - this.maxEntries);
    await this.storage().set(this.getKey(queue), trimmed);
  }

  private async getAllQueueKeys(): Promise<string[]> {
    const keys = await this.storage().keys();
    return keys.filter((k) => Str.startsWith(k, this.prefix));
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// Connector
// ════════════════════════════════════════════════════════════════════════════════

/**
 * IndexedDB connector — creates `IndexedDBConnection` instances
 * wired to the app's `StorageManager`.
 */
@Injectable()
export class IndexedDBConnector implements IQueueConnector {
  /**
   * @param manager - The resolved `IStorageManager`, passed to every
   *   `IndexedDBConnection` this connector creates.
   */
  public constructor(@Inject(STORAGE_MANAGER) private readonly manager: IStorageManager) {}

  public async connect(config: IQueueConnectionConfig): Promise<IQueueConnection> {
    return new IndexedDBConnection(this.manager, config);
  }
}
