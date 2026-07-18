/**
 * @file queue-connector.interface.ts
 * @module @stackra/queue/core/interfaces
 * @description Factory interface for creating queue connections from config.
 *   Connectors are registered via `QueueModule.forFeature()`.
 */

import type { IQueueConnection } from "./queue-connection.interface";
import type { IQueueConnectionConfig } from "./queue-module-options.interface";

/**
 * Factory that creates a connection instance from its configuration.
 *
 * Each driver (memory, indexeddb, bullmq, etc.) implements this interface.
 * The QueueManager calls `connect(config)` to create the runtime connection.
 */
export interface IQueueConnector {
  /** Create and return a new queue connection from the given config. */
  connect(config: IQueueConnectionConfig): Promise<IQueueConnection>;
}
