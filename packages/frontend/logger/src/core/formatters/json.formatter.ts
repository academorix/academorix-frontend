/**
 * @file json.formatter.ts
 * @module @stackra/logger/core/formatters
 * @description JSON formatter — serializes log entries to single-line JSON strings.
 *   Ideal for production environments where logs are consumed by aggregators.
 */

import type { ILogEntry, ILogFormatter } from "@stackra/contracts";

/**
 * JSON formatter — converts log entries to single-line JSON strings.
 *
 * Output format:
 * ```json
 * {"level":"info","message":"User created","context":"UserService","timestamp":"...","meta":{}}
 * ```
 *
 * Error objects are serialized with name, message, stack, and cause chain.
 */
export class JsonFormatter implements ILogFormatter {
  /** Formatter identifier. */
  public readonly name = "json";

  /**
   * Format a log entry as a single-line JSON string.
   *
   * @param entry - Log entry to format
   * @returns JSON string representation
   */
  public format(entry: ILogEntry): string {
    const output: Record<string, unknown> = {
      level: entry.level,
      message: entry.message,
      context: entry.context,
      timestamp: entry.timestamp,
    };

    if (entry.meta && Object.keys(entry.meta).length > 0) {
      output.meta = entry.meta;
    }

    if (entry.error) {
      output.error = this.serializeError(entry.error);
    }

    return JSON.stringify(output);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Serialize an Error object with full cause chain.
   *
   * @param error - Error to serialize
   * @returns Serialized error object
   */
  private serializeError(error: Error): Record<string, unknown> {
    const serialized: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    if (error.cause) {
      serialized.cause =
        error.cause instanceof Error ? this.serializeError(error.cause) : error.cause;
    }

    return serialized;
  }
}
