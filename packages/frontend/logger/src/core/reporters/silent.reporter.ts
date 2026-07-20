/**
 * @file silent.reporter.ts
 * @module @stackra/logger/core/reporters
 * @description Silent reporter — no-op implementation for testing.
 *   Swallows all log entries. Useful for unit tests that don't want
 *   console noise.
 */

import { type ILogReporter, type ILogEntry } from "@stackra/contracts";

import { Reporter } from "@/core/decorators/reporter.decorator";

/**
 * Silent reporter — discards all entries.
 *
 * Use in test environments or when you need a channel that produces
 * no output (e.g., a temporary mute during batch operations).
 */
@Reporter("silent")
export class SilentReporter implements ILogReporter {
  /** Reporter identifier. */
  public readonly name = "silent";

  /**
   * No-op write — entry is discarded.
   *
   * @param _entry - Ignored
   */
  public write(_entry: ILogEntry): void {
    // Intentionally empty — this is the silent reporter
  }
}
