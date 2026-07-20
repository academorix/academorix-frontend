/**
 * @file json.reporter.ts
 * @module @stackra/logger/core/reporters
 * @description JSON reporter — writes structured JSON entries to stdout.
 *   Ideal for production environments where logs are consumed by
 *   aggregators (CloudWatch, Datadog, ELK, Loki, etc.).
 */

import { type ILogReporter, type ILogEntry } from "@stackra/contracts";

import { Reporter } from "@/core/decorators/reporter.decorator";

/**
 * JSON reporter — outputs one JSON object per line to stdout.
 *
 * Each line is a complete, parseable JSON object suitable for
 * log aggregation pipelines. No color codes, no formatting.
 *
 * Output format:
 * ```json
 * {"level":"info","message":"User created","context":"UserService","timestamp":"2026-06-04T10:30:00.000Z","meta":{"userId":"abc123"}}
 * ```
 */
@Reporter("json")
export class JsonReporter implements ILogReporter {
  /** Reporter identifier referenced in channel config. */
  public readonly name = "json";

  /**
   * Write a log entry as a single-line JSON object to stdout.
   *
   * @param entry - Structured log entry
   */
  public write(entry: ILogEntry): void {
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
      output.error = {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack,
      };
    }

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(output));
  }
}
