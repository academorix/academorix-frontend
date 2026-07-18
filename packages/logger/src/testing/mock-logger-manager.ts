/**
 * @file mock-logger-manager.ts
 * @module @stackra/logger/testing
 * @description In-memory `ILoggerManager` implementation for tests.
 *
 *   Caches loggers by context so repeated `create('foo')` calls return
 *   the same `MockLogger` — makes it easy to reach into a specific
 *   scoped logger and assert on its entries.
 */

import type { ILoggerManager } from "@stackra/contracts";
import { MockLogger } from "./mock-logger";

/**
 * In-memory logger manager for testing.
 *
 * Every `create(context)` / `channel(context, channelName)` call is
 * memoised — the same `MockLogger` is returned for the same key so
 * tests can assert on entries recorded across the app under a shared
 * context.
 */
export class MockLoggerManager implements ILoggerManager {
  private readonly loggers = new Map<string, MockLogger>();

  public create(context: string): MockLogger {
    return this.getOrCreate(context);
  }

  public channel(context: string, channelName: string): MockLogger {
    return this.getOrCreate(`${context}::${channelName}`);
  }

  /**
   * Direct access to the logger for a given context — bypasses the
   * `ILoggerManager` interface. Handy for tests that need to inspect
   * a scoped logger's ledger.
   */
  public getLogger(context: string): MockLogger | undefined {
    return this.loggers.get(context);
  }

  /** Every logger ever created, keyed by context. */
  public getAllLoggers(): ReadonlyMap<string, MockLogger> {
    return this.loggers;
  }

  /** Flatten every log across every scoped logger. */
  public getAllLogs() {
    return Array.from(this.loggers.values()).flatMap((l) => l.logs);
  }

  /** Drop every scoped logger and its ledger. */
  public reset(): void {
    for (const logger of this.loggers.values()) logger.clearLogs();
    this.loggers.clear();
  }

  private getOrCreate(key: string): MockLogger {
    const cached = this.loggers.get(key);
    if (cached) return cached;
    const fresh = new MockLogger();
    this.loggers.set(key, fresh);
    return fresh;
  }
}
