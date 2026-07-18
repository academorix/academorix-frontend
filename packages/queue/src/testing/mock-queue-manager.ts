/**
 * @file mock-queue-manager.ts
 * @module @stackra/queue/testing
 * @description In-memory queue manager surface for tests.
 *
 *   Mirrors the shape of `QueueManager` (async `connection()`, `dispatch()`,
 *   `disconnect()`) so consumer code that injects `QUEUE_MANAGER` can be
 *   swapped over with zero changes.
 */

import type { IJobOptions } from "@/core/interfaces/job-options.interface";
import { MockQueueConnection } from "./mock-queue-connection";

/**
 * Assertable-friendly mock queue manager.
 *
 * Resolves named connections lazily — each call to `.connection(name)`
 * with a new name spawns a fresh `MockQueueConnection`. All connections
 * are cached, so successive calls with the same name return the same
 * instance and can be inspected via `.dispatchedJobs`.
 */
export class MockQueueManager {
  /** Resolved connection cache — same instance returned for repeat calls. */
  private readonly connections = new Map<string, MockQueueConnection>();

  /** Test-configurable default connection name. */
  private defaultConnection: string = "default";

  public getDefaultDriver(): string {
    return this.defaultConnection;
  }

  /** Test helper — override the default connection name. */
  public setDefaultDriver(name: string): void {
    this.defaultConnection = name;
  }

  public async connection(name?: string): Promise<MockQueueConnection> {
    const key = name ?? this.defaultConnection;
    const cached = this.connections.get(key);
    if (cached) return cached;
    const fresh = new MockQueueConnection();
    this.connections.set(key, fresh);
    return fresh;
  }

  public async dispatch<T = unknown>(
    name: string,
    data: T,
    options?: IJobOptions,
  ): Promise<string> {
    const conn = await this.connection();
    return conn.push(name, data, options);
  }

  public async disconnect(name?: string): Promise<void> {
    const key = name ?? this.defaultConnection;
    const conn = this.connections.get(key);
    if (conn) {
      await conn.close();
      this.connections.delete(key);
    }
  }

  public async disconnectAll(): Promise<void> {
    for (const key of Array.from(this.connections.keys())) {
      await this.disconnect(key);
    }
  }

  public getConnectionNames(): string[] {
    return Array.from(this.connections.keys());
  }

  /** Flatten every job dispatched across every connection — handy for assertions. */
  public getAllDispatchedJobs() {
    return Array.from(this.connections.values()).flatMap((c) => c.dispatchedJobs);
  }
}
