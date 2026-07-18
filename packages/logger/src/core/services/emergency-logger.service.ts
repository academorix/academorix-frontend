/**
 * @file emergency-logger.service.ts
 * @module @stackra/logger/core/services
 * @description Emergency fallback logger that writes to stderr.
 *   Used when a channel fails to resolve — ensures that logging never
 *   throws and critical messages are not silently lost.
 */

import type { ILogEntry } from "@stackra/contracts";
import { Str } from "@stackra/support";

/**
 * Emergency fallback logger — writes directly to stderr via console.error.
 *
 * This is a last-resort logger that activates when the normal channel
 * resolution pipeline fails. It formats entries as simple structured text
 * and writes to stderr so ops teams can detect misconfiguration.
 *
 * Not injectable — instantiated statically by LoggerManager.
 *
 * @example
 * ```typescript
 * // Used internally by LoggerManager when channel resolution fails:
 * EmergencyLogger.log(entry);
 * EmergencyLogger.warn('Channel "audit" is misconfigured', error);
 * ```
 */
export class EmergencyLogger {
  /**
   * Log an entry to stderr as a fallback.
   *
   * @param entry - The log entry that failed to dispatch normally
   */
  public static log(entry: ILogEntry): void {
    const timestamp = entry.timestamp ?? new Date().toISOString();
    const meta = entry.meta ? ` ${JSON.stringify(entry.meta)}` : "";
    const err = entry.error ? ` | Error: ${entry.error.message}` : "";

    // Route through `Str.upper` per `.kiro/steering/support-utilities.md`
    // instead of a bare `.toUpperCase()`.
    // eslint-disable-next-line no-console
    console.error(
      `[EMERGENCY] [${timestamp}] [${Str.upper(entry.level)}] [${entry.context}] ${entry.message}${meta}${err}`,
    );
  }

  /**
   * Log a warning about a misconfiguration or channel resolution failure.
   *
   * @param message - Warning message describing what went wrong
   * @param error - The original error that triggered the fallback
   */
  public static warn(message: string, error?: unknown): void {
    const errMsg = error instanceof Error ? error.message : String(error ?? "");

    // eslint-disable-next-line no-console
    console.error(
      `[EMERGENCY] [${new Date().toISOString()}] [WARN] [LoggerManager] ${message}${errMsg ? ` — ${errMsg}` : ""}`,
    );
  }
}
