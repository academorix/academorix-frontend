/**
 * @file console.reporter.ts
 * @module @stackra/logger/core/reporters
 * @description Console reporter powered by consola.
 *   Uses consola for beautiful, cross-platform console output with
 *   automatic level-based formatting, tag support, and browser compatibility.
 */

import { type ILogReporter, type ILogEntry, LogLevel } from "@stackra/contracts";
import { createConsola } from "consola";

import { Reporter } from "@/core/decorators/reporter.decorator";

/**
 * Console reporter — writes formatted log entries via consola.
 *
 * Consola provides:
 * - Beautiful colored output in terminal
 * - Browser DevTools-friendly output in the browser
 * - Automatic level filtering
 * - Tag/badge support for context names
 * - Timestamp formatting
 *
 * This is the default reporter for development environments.
 *
 * @example
 * ```typescript
 * LoggerModule.forRoot({
 *   default: 'app',
 *   channels: { app: { level: 'debug', reporters: ['console'] } },
 * });
 * ```
 */
@Reporter("console")
export class ConsoleReporter implements ILogReporter {
  /** Reporter identifier referenced in channel config. */
  public readonly name = "console";

  /** Consola instance for output. */
  private readonly consola = createConsola({
    level: 999, // Don't filter — our LoggerManager handles level filtering
    formatOptions: {
      date: true,
      colors: true,
      compact: false,
    },
  });

  /**
   * Write a log entry to the console via consola.
   *
   * @param entry - Structured log entry
   */
  public write(entry: ILogEntry): void {
    const tag = entry.context;
    const message = entry.message;
    const meta = entry.meta && Object.keys(entry.meta).length > 0 ? entry.meta : undefined;

    switch (entry.level) {
      case LogLevel.DEBUG:
        this.consola.debug({ message, tag, ...(meta ? { args: [meta] } : {}) });
        break;

      case LogLevel.INFO:
        this.consola.info({ message, tag, ...(meta ? { args: [meta] } : {}) });
        break;

      case LogLevel.WARNING:
        this.consola.warn({ message, tag, ...(meta ? { args: [meta] } : {}) });
        break;

      case LogLevel.ERROR:
        if (entry.error) {
          this.consola.error({ message, tag, args: [entry.error, ...(meta ? [meta] : [])] });
        } else {
          this.consola.error({ message, tag, ...(meta ? { args: [meta] } : {}) });
        }
        break;

      case LogLevel.EMERGENCY:
        this.consola.fatal({
          message,
          tag,
          args: [entry.error, ...(meta ? [meta] : [])].filter(Boolean),
        });
        break;

      default:
        this.consola.log({ message, tag });
    }
  }
}
