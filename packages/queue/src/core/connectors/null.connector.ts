/**
 * @file null.connector.ts
 * @module @stackra/queue/core/connectors
 * @description No-op queue connector for testing.
 *   All operations succeed silently. Push returns a fake ID, pop returns null.
 *   Use when you need to disable queue processing without changing application code.
 */

import { Injectable } from "@stackra/container";
import type {
  IQueueConnection,
  IQueueConnector,
  IJobOptions,
  IQueuedJob,
  IQueueConnectionConfig,
} from "@/core/interfaces";

// ════════════════════════════════════════════════════════════════════════════════
// Connection
// ════════════════════════════════════════════════════════════════════════════════

/** Null connection — discards all jobs silently. */
export class NullConnection implements IQueueConnection {
  private idCounter = 0;

  public async push<T>(_name: string, _data: T, _options?: IJobOptions): Promise<string> {
    return `null_${++this.idCounter}`;
  }

  public async later<T>(
    _delayMs: number,
    _name: string,
    _data: T,
    _options?: IJobOptions,
  ): Promise<string> {
    return `null_${++this.idCounter}`;
  }

  public async bulk<T>(
    jobs: Array<{ name: string; data: T; options?: IJobOptions }>,
  ): Promise<string[]> {
    return jobs.map(() => `null_${++this.idCounter}`);
  }

  public async pop(_queue?: string): Promise<IQueuedJob | null> {
    return null;
  }

  public async size(_queue?: string): Promise<number> {
    return 0;
  }

  public async remove(_jobId: string): Promise<void> {}
  public async pause(_queue?: string): Promise<void> {}
  public async resume(_queue?: string): Promise<void> {}
  public async clear(_queue?: string): Promise<void> {}
  public async close(): Promise<void> {}
}

// ════════════════════════════════════════════════════════════════════════════════
// Connector
// ════════════════════════════════════════════════════════════════════════════════

/** Null connector — creates NullConnection instances for testing. */
@Injectable()
export class NullConnector implements IQueueConnector {
  public async connect(_config: IQueueConnectionConfig): Promise<IQueueConnection> {
    return new NullConnection();
  }
}
