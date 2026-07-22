/**
 * @file queue-manager.service.ts
 * @module @stackra/queue/core/services
 * @description Multi-instance queue manager built on
 *   `MultipleInstanceManager`. Resolves named queue connections lazily
 *   from `config.connections[name]` — each connection carries its own
 *   driver + config, matching the shape `MultipleInstanceManager`
 *   models.
 *
 *   Public API stays exactly the same as before the base-class swap:
 *   `connection(name?)` returns an `IQueueConnection`, `dispatch(...)`
 *   sends to the default connection, `disconnect(name?)` closes one,
 *   `disconnectAll()` closes them all, and `extend(driver, creator)`
 *   registers a custom driver factory.
 *
 *   Migration note: this class previously extended
 *   `Manager<IQueueConnection>` which models one shared driver
 *   factory. Queue's config carries per-connection settings
 *   (`connections.default.driver`, `connections.emails.prefix`, etc.),
 *   so `MultipleInstanceManager<T>` is the correct base per
 *   `.kiro/steering/package-conventions.md` §"Manager base" and the
 *   audit at `.kiro/reports/manager-base-class-review-2026-07-22.md`
 *   F2.
 */

import { Injectable, Inject } from "@stackra/container";
import { MultipleInstanceManager } from "@stackra/support";

import type { IQueueConnection, IQueueModuleOptions, IJobOptions } from "@/core/interfaces";

import { MemoryConnector } from "@/core/connectors/memory.connector";
import { SyncConnector } from "@/core/connectors/sync.connector";
import { QUEUE_CONFIG_INTERNAL } from "@/core/constants/queue-config-internal.constant";

/**
 * Queue manager — resolves named queue connections.
 *
 * Built-in drivers: `memory`, `sync`.
 * Custom drivers register via `extend()` or `QueueModule.forFeature()`.
 *
 * @example
 * ```typescript
 * const manager = container.get<QueueManager>(QUEUE_MANAGER);
 * const conn = await manager.connection();           // default
 * const mem = await manager.connection('memory');    // named
 *
 * await conn.push('send-email', { to: 'user@example.com' });
 * ```
 */
@Injectable()
export class QueueManager extends MultipleInstanceManager<IQueueConnection> {
  /**
   * @param config - Queue module configuration injected via DI. Bound
   *   by `QueueModule.forRoot` / `.forRootAsync` under the
   *   package-internal `QUEUE_CONFIG_INTERNAL` symbol.
   */
  public constructor(@Inject(QUEUE_CONFIG_INTERNAL) private readonly config: IQueueModuleOptions) {
    super();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MultipleInstanceManager contract
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * @inheritdoc
   * Returns the connection name from `config.default`.
   */
  public getDefaultInstance(): string {
    return this.config.default;
  }

  /**
   * @inheritdoc
   * Mutates the in-memory `config.default` for the process lifetime;
   * does not persist back to any external config store.
   */
  public setDefaultInstance(name: string): void {
    this.config.default = name;
  }

  /**
   * @inheritdoc
   * Returns the per-connection config from `config.connections[name]`,
   * or `null` when the name is not declared.
   */
  public getInstanceConfig(name: string): Record<string, unknown> | null {
    return (this.config.connections[name] as unknown as Record<string, unknown>) ?? null;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get the default driver name.
   *
   * Kept for backwards compatibility with pre-migration consumers.
   * New code should call `getDefaultInstance()` — same value, canonical
   * name from `MultipleInstanceManager`.
   *
   * @returns The configured default connection name
   */
  public getDefaultDriver(): string {
    return this.getDefaultInstance();
  }

  /**
   * Resolve a named connection asynchronously — connectors may need
   * setup (open sockets, warm up the backend). Domain alias for
   * `MultipleInstanceManager.instanceAsync(name)`; reads naturally at
   * call sites (`manager.connection('emails')` vs.
   * `manager.instanceAsync('emails')`).
   *
   * Resolved connections are cached — subsequent calls return the
   * same live connection.
   *
   * @param name - Connection name (defaults to the configured default)
   * @returns The resolved connection
   */
  public async connection(name?: string): Promise<IQueueConnection> {
    return this.instanceAsync(name);
  }

  /**
   * Dispatch a job to the default connection (convenience).
   *
   * @param name - Job name
   * @param data - Job payload
   * @param options - Job options
   * @returns The job ID
   */
  public async dispatch<T = unknown>(
    name: string,
    data: T,
    options?: IJobOptions,
  ): Promise<string> {
    const conn = await this.connection();
    return conn.push(name, data, options);
  }

  /**
   * Close a specific connection and forget its cached instance.
   *
   * @param name - Connection name to close (defaults to default)
   */
  public async disconnect(name?: string): Promise<void> {
    const connectionName = name ?? this.getDefaultInstance();
    const conn = this.instances.get(connectionName);
    if (conn) {
      await conn.close();
      this.forgetInstance(connectionName);
    }
  }

  /**
   * Close every resolved connection.
   */
  public async disconnectAll(): Promise<void> {
    // Snapshot names first — `disconnect(name)` mutates the map.
    for (const name of [...this.getResolvedInstances()]) {
      await this.disconnect(name);
    }
  }

  /**
   * Get all configured connection names.
   *
   * @returns Array of connection name strings
   */
  public getConnectionNames(): string[] {
    return Object.keys(this.config.connections);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Built-in driver factories
  //
  // Convention: `create{StudlyDriverName}Driver(config)` per
  // MultipleInstanceManager. `driverKey` defaults to 'driver' — matches
  // `IQueueConnectionConfig.driver`.
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Create the built-in `memory` connection.
   *
   * @param config - The connection's config entry from
   *   `connections[name]` (driver-specific fields like `prefix` etc.)
   * @returns A resolved in-memory queue connection
   */
  protected async createMemoryDriver(config: Record<string, unknown>): Promise<IQueueConnection> {
    return new MemoryConnector().connect(config as never);
  }

  /**
   * Create the built-in `sync` connection.
   *
   * @param config - The connection's config entry.
   * @returns A resolved synchronous queue connection
   */
  protected async createSyncDriver(config: Record<string, unknown>): Promise<IQueueConnection> {
    return new SyncConnector().connect(config as never);
  }
}
