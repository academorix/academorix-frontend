/**
 * @file queue-manager.service.ts
 * @module @stackra/queue/core/services
 * @description Multi-driver queue manager — resolves named connections lazily.
 *   Extends Manager pattern to support memory, sync, indexeddb, and custom drivers.
 */

import { Injectable, Inject } from "@stackra/container";
import { Manager } from "@stackra/support";
import { QUEUE_CONFIG_INTERNAL } from "@/core/constants/queue-config-internal.constant";
import { QueueDriverError } from "@/core/errors";
import type { IQueueConnection, IQueueModuleOptions, IJobOptions } from "@/core/interfaces";
import { MemoryConnector } from "@/core/connectors/memory.connector";
import { SyncConnector } from "@/core/connectors/sync.connector";

/**
 * Queue manager — resolves named queue connections.
 *
 * Built-in drivers: 'memory', 'sync'.
 * Custom drivers registered via `extend()` or `QueueModule.forFeature()`.
 *
 * @example
 * ```typescript
 * const manager = container.get<QueueManager>(QUEUE_MANAGER);
 * const conn = manager.connection();           // default
 * const mem = manager.connection('memory');    // named
 *
 * await conn.push('send-email', { to: 'user@example.com' });
 * ```
 */
@Injectable()
export class QueueManager extends Manager<IQueueConnection> {
  /** Resolved async connections cache. */
  private readonly asyncConnections = new Map<string, IQueueConnection>();

  /**
   * @param config - Queue module configuration injected via DI. Bound
   *   by `QueueModule.forRoot` / `.forRootAsync` under the
   *   package-internal `QUEUE_CONFIG_INTERNAL` symbol.
   */
  public constructor(@Inject(QUEUE_CONFIG_INTERNAL) private readonly config: IQueueModuleOptions) {
    super();
  }

  /**
   * Get the default driver name.
   *
   * @returns The configured default connection name
   */
  public getDefaultDriver(): string {
    return this.config.default;
  }

  /**
   * Resolve a named connection (async — connectors may need setup).
   *
   * @param name - Connection name (defaults to the configured default)
   * @returns The resolved connection
   */
  public async connection(name?: string): Promise<IQueueConnection> {
    const connectionName = name ?? this.config.default;

    // Return cached if exists
    const cached = this.asyncConnections.get(connectionName);
    if (cached) return cached;

    // Get the config for this connection
    const connConfig = this.config.connections[connectionName];
    if (!connConfig) {
      throw new QueueDriverError(`Queue connection "${connectionName}" is not configured.`);
    }

    // Create the connection using the appropriate connector
    const connection = await this.createConnection(connConfig.driver, connConfig);
    this.asyncConnections.set(connectionName, connection);
    return connection;
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
   * Close a specific connection.
   *
   * @param name - Connection name to close (defaults to default)
   */
  public async disconnect(name?: string): Promise<void> {
    const connectionName = name ?? this.config.default;
    const conn = this.asyncConnections.get(connectionName);
    if (conn) {
      await conn.close();
      this.asyncConnections.delete(connectionName);
    }
  }

  /**
   * Close all connections.
   */
  public async disconnectAll(): Promise<void> {
    for (const [name] of this.asyncConnections) {
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

  // ══════════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════════

  /** Create a connection using built-in or extended connectors. */
  private async createConnection(
    driver: string,
    config: Record<string, unknown>,
  ): Promise<IQueueConnection> {
    switch (driver) {
      case "memory":
        return new MemoryConnector().connect(config as any);
      case "sync":
        return new SyncConnector().connect(config as any);
      default:
        throw new QueueDriverError(
          `Queue driver "${driver}" is not registered. ` +
            `Use extend() or QueueModule.forFeature() to register.`,
        );
    }
  }
}
