/**
 * @file mock-logger.ts
 * @module @stackra/logger/testing
 * @description In-memory `ILogger` implementation for tests.
 *
 *   Every log call (debug/info/warn/error/etc.) is appended to `.logs`
 *   with its level, message, and context. Tests can filter by level,
 *   assert on the last entry, or clear the ledger between assertions.
 */

import type { ILogger, LogContext } from "@stackra/contracts";

/** A single recorded log entry. */
export interface RecordedLog {
  level: string;
  message: string;
  context?: LogContext;
  errorOrContext?: unknown;
  loggedAt: number;
}

/**
 * In-memory logger for testing.
 *
 * Implements every method on the `ILogger` contract. `.logs` is a
 * public array so tests can `expect(logger.logs).toContainEqual(...)`
 * directly if they prefer that style over the `$.wasCalled...` matchers.
 */
export class MockLogger implements ILogger {
  /** Every log entry ever recorded, in chronological order. */
  public readonly logs: RecordedLog[] = [];

  public debug(message: string, context?: LogContext): void {
    this.record("debug", message, context);
  }
  public info(message: string, context?: LogContext): void {
    this.record("info", message, context);
  }
  public notice(message: string, context?: LogContext): void {
    this.record("notice", message, context);
  }
  public warning(message: string, context?: LogContext): void {
    this.record("warning", message, context);
  }
  public warn(message: string, context?: LogContext): void {
    this.record("warn", message, context);
  }
  public error(message: string, errorOrContext?: Error | unknown, context?: LogContext): void {
    this.record("error", message, context, errorOrContext);
  }
  public critical(message: string, context?: LogContext): void {
    this.record("critical", message, context);
  }
  public alert(message: string, context?: LogContext): void {
    this.record("alert", message, context);
  }
  public emergency(message: string, context?: LogContext): void {
    this.record("emergency", message, context);
  }
  public fatal(message: string, errorOrContext?: Error | unknown, context?: LogContext): void {
    this.record("fatal", message, context, errorOrContext);
  }
  public log(message: string, context?: LogContext): void {
    this.record("log", message, context);
  }

  /** Return only entries at the given level. */
  public getLogsByLevel(level: string): RecordedLog[] {
    return this.logs.filter((l) => l.level === level);
  }

  /** Drop the log ledger. */
  public clearLogs(): void {
    this.logs.length = 0;
  }

  private record(
    level: string,
    message: string,
    context?: LogContext,
    errorOrContext?: unknown,
  ): void {
    this.logs.push({ level, message, context, errorOrContext, loggedAt: Date.now() });
  }
}
