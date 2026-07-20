/**
 * @file token-builders.util.ts
 * @module @stackra/queue/core/utils
 * @description DI token builder functions for queue handles and connections.
 */

/**
 * Generate a DI token for a specific (queue, connection) pair.
 *
 * @param queue - Queue name (default: 'default')
 * @param connection - Connection name (default: 'default')
 * @returns A unique string token
 */
export function getQueueToken(queue: string = "default", connection: string = "default"): string {
  return `QUEUE_HANDLE_${connection}:${queue}`;
}

/**
 * Generate a DI token for a queue connection.
 *
 * @param name - Connection name (default: 'default')
 * @returns A unique string token
 */
export function getQueueConnectionToken(name: string = "default"): string {
  return `QUEUE_CONNECTION_${name}`;
}
